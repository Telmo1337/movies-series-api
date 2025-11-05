// routes/comments.routes.js
import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import { z } from "zod";

const commentRouter = Router();

const commentSchema = z.object({
  content: z.string().min(1),
  mediaId: z.string().uuid(),
});

// criar comentário
commentRouter.post("/", verifyToken, async (req, res, next) => {
  try {
    const result = commentSchema.safeParse(req.body);
    if (!result.success)
      return res.status(400).json({ errors: result.error.flatten().fieldErrors });

    const comment = await prisma.comment.create({
      data: { ...result.data, userId: req.user.id },
    });

    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

// listar comentários de um media
commentRouter.get("/:mediaId", async (req, res, next) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { mediaId: req.params.mediaId },
      include: { user: { select: { id: true, name: true } } },
    });
    res.json(comments);
  } catch (err) {
    next(err);
  }
});

export default commentRouter;
