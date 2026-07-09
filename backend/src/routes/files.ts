import { Router } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { deleteFile, getFile, putFile } from "../lib/storage.js";

const maxFileSizeBytes = 200 * 1024 * 1024;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: maxFileSizeBytes } });

const allowedExtensions = new Set([
  ".pdf", ".xlsx", ".xls", ".csv",
  ".jpg", ".jpeg", ".png", ".tif", ".tiff",
  ".kml", ".kmz", ".shp", ".dwg", ".las", ".laz"
]);

const contentTypesByExtension: Record<string, string> = {
  ".pdf": "application/pdf",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".xls": "application/vnd.ms-excel",
  ".csv": "text/csv",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".kml": "application/vnd.google-earth.kml+xml",
  ".kmz": "application/vnd.google-earth.kmz",
  ".shp": "application/octet-stream",
  ".dwg": "application/acad",
  ".las": "application/octet-stream",
  ".laz": "application/octet-stream"
};

export const filesRouter = Router();

function extensionOf(fileName: string) {
  const match = String(fileName || "").toLowerCase().match(/\.[a-z0-9]+$/);
  return match ? match[0] : "";
}

function safeFileName(fileName: string) {
  return String(fileName || "upload.bin")
    .replace(/[\\/]/g, "-")
    .replace(/[^\w.\-() ]+/g, "_")
    .slice(0, 180) || "upload.bin";
}

function readRawRequest(req: any) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    req.on("data", (chunk: Buffer) => {
      total += chunk.length;
      if (total > maxFileSizeBytes) {
        reject(new Error("File exceeds the 200 MB upload limit"));
        req.destroy();
        return;
      }
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function findFile(identifier: string, projectIdValue?: string) {
  const projectId = projectIdValue && /^\d+$/.test(projectIdValue) ? BigInt(projectIdValue) : null;
  if (projectId) {
    const byAnnexure = await prisma.dsrFile.findUnique({
      where: { projectId_annexureId: { projectId, annexureId: identifier } }
    });
    if (byAnnexure) return byAnnexure;
  }
  return prisma.dsrFile.findFirst({
    where: {
      OR: [
        { annexureId: identifier },
        { objectKey: identifier },
        { fileName: identifier }
      ]
    },
    orderBy: { createdAt: "desc" }
  });
}

filesRouter.post("/upload", upload.single("file"), async (req: any, res) => {
  try {
    const projectIdValue = String(req.query.projectId || req.body?.projectId || "");
    const projectId = /^\d+$/.test(projectIdValue) ? BigInt(projectIdValue) : null;
    if (!projectId) {
      res.status(400).json({ success: false, error: "Missing projectId" });
      return;
    }

    const queryName = String(req.query.name || req.headers["x-file-name"] || "");
    const originalName = safeFileName(req.file?.originalname || queryName);
    const ext = extensionOf(originalName);
    if (!allowedExtensions.has(ext)) {
      res.status(400).json({ success: false, error: "Unsupported file format for replenishment upload" });
      return;
    }

    const bytes = req.file?.buffer || await readRawRequest(req);
    if (!bytes.length) {
      res.status(400).json({ success: false, error: "File is required" });
      return;
    }
    if (bytes.byteLength > maxFileSizeBytes) {
      res.status(400).json({ success: false, error: "File exceeds the 200 MB upload limit" });
      return;
    }

    const contentType = req.file?.mimetype
      || String(req.headers["content-type"] || "")
      || contentTypesByExtension[ext]
      || "application/octet-stream";
    const moduleName = safeFileName(String(req.query.module || "replenishment")).replace(/\./g, "");
    const requirement = safeFileName(String(req.query.requirementId || "upload")).replace(/\./g, "");
    const annexureId = `file-${moduleName}-${Date.now()}-${randomUUID()}`;
    const objectKey = `files/${projectId.toString()}/${moduleName}/${requirement}/${annexureId}-${originalName}`;

    await putFile(objectKey, bytes, contentType);
    const file = await prisma.dsrFile.create({
      data: {
        projectId,
        annexureId,
        fileName: originalName,
        objectKey,
        contentType,
        sizeBytes: bytes.byteLength
      }
    });

    res.status(201).json({
      success: true,
      id: file.id.toString(),
      originalName,
      fileName: file.fileName,
      savedName: file.annexureId,
      objectKey: file.objectKey,
      contentType: file.contentType,
      sizeBytes: file.sizeBytes,
      uploadedBy: String(req.query.uploadedBy || req.headers["x-uploaded-by"] || ""),
      uploadedAt: file.createdAt.toISOString(),
      url: `/api/files/download/${encodeURIComponent(file.annexureId)}?inline=true`,
      downloadUrl: `/api/files/download/${encodeURIComponent(file.annexureId)}`
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Upload failed" });
  }
});

filesRouter.get("/download/:identifier", async (req, res) => {
  try {
    const file = await findFile(req.params.identifier, String(req.query.projectId || ""));
    if (!file) {
      res.status(404).type("text/plain").send("File not found");
      return;
    }
    const bytes = await getFile(file.objectKey);
    const inline = String(req.query.inline || "false") === "true";
    res.setHeader("Content-Type", file.contentType || "application/octet-stream");
    res.setHeader("Content-Disposition", `${inline ? "inline" : "attachment"}; filename="${encodeURIComponent(file.fileName)}"`);
    res.send(bytes);
  } catch (error: any) {
    res.status(404).type("text/plain").send(`File not found or error loading: ${error.message}`);
  }
});

filesRouter.delete("/:identifier", async (req, res) => {
  try {
    const file = await findFile(req.params.identifier, String(req.query.projectId || ""));
    if (!file) {
      res.status(404).json({ success: false, error: "File not found" });
      return;
    }
    await deleteFile(file.objectKey).catch(() => undefined);
    await prisma.dsrFile.delete({ where: { id: file.id } });
    res.json({ success: true, message: "File deleted" });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || "Delete failed" });
  }
});
