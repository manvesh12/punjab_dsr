import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { jsonSafe } from "../lib/json.js";

export const searchRouter = Router();

// Mock function to simulate generating an embedding vector from OpenAI
// In production, you would call OpenAI API: openai.embeddings.create({ input, model: "text-embedding-ada-002" })
async function generateEmbedding(text: string): Promise<number[]> {
  // Return a mock vector of 1536 dimensions
  return Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
}

// POST /api/search
// Body: { query: string, limit?: number }
searchRouter.post("/", async (req, res) => {
  try {
    const { query, limit = 5 } = req.body;

    if (!query) {
       res.status(400).json({ error: "Query is required for semantic search" });
       return;
    }

    // 1. Convert user's text query into a vector embedding
    const queryEmbedding = await generateEmbedding(query);

    // 2. Perform Cosine Similarity Search using pgvector (<=> operator)
    // We use Prisma's raw query since vector operations are heavily SQL-based
    const results = await prisma.$queryRaw`
      SELECT 
        "id", 
        "projectId", 
        "section", 
        "content",
        1 - ("embedding" <=> ${queryEmbedding}::vector) as similarity
      FROM "DsrReportChunk"
      ORDER BY "embedding" <=> ${queryEmbedding}::vector
      LIMIT ${Number(limit)};
    `;

    res.json(jsonSafe({
      query,
      results
    }));
  } catch (error: any) {
    console.error("Vector Search Error:", error);
    res.status(500).json({ error: "Failed to perform semantic search" });
  }
});

// POST /api/search/index
// Used to index a new paragraph into the vector database
searchRouter.post("/index", async (req, res) => {
  try {
    const { projectId, section, content } = req.body;
    
    if (!projectId || !content) {
       res.status(400).json({ error: "projectId and content are required" });
       return;
    }

    // Convert text to vector
    const embedding = await generateEmbedding(content);

    // Insert into DB using raw query to handle the vector cast
    await prisma.$executeRaw`
      INSERT INTO "DsrReportChunk" ("id", "projectId", "section", "content", "embedding", "createdAt")
      VALUES (
        gen_random_uuid(), 
        ${BigInt(projectId)}, 
        ${section || 'General'}, 
        ${content}, 
        ${embedding}::vector, 
        NOW()
      )
    `;

    res.status(201).json({ message: "Content indexed successfully" });
  } catch (error: any) {
    console.error("Index Error:", error);
    res.status(500).json({ error: "Failed to index content" });
  }
});
