import { Router } from "express";
import multer from "multer";
import { canAdmin } from "../authorization/role.policy.js";
import { usersController } from "./users.controller.js";

const upload = multer({ storage: multer.memoryStorage() });
export const usersRouter = Router();

usersRouter.use((req, res, next) => {
  if (!canAdmin(req.user!.role)) { res.status(403).json({ error: "Only Admin can manage users" }); return; }
  next();
});
usersRouter.get("/", usersController.list);
usersRouter.get("/export", usersController.export);
usersRouter.get("/invite-template", usersController.inviteTemplate);
usersRouter.post("/", usersController.create);
usersRouter.put("/:id", usersController.update);
usersRouter.patch("/:id/active", usersController.setActive);
usersRouter.delete("/:id", usersController.delete);
usersRouter.post("/invite", usersController.invite);
usersRouter.post("/invite/bulk", upload.single("file"), usersController.bulkInvite);
