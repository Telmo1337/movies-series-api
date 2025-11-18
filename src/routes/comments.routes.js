// routes/comments.routes.js
import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { verifyToken } from "../utils/auth.js";

const commentRouter = Router();

//ver todos os comentários de um media de um utilizador
commentRouter.get("/user/:nickName", async (req, res, next) => {
  try {
    const comments = await prisma.comment.findMany({
      where: {
        user: { nickName: req.params.nickName }
      },
      include: {
        media: { select: { id: true, title: true } },
        user: { select: { id: true, nickName: true } }
      }
    });

    res.json(comments);
  } catch (err) {
    next(err);
  }
});


//editar comentario
commentRouter.put("/:commentId", verifyToken, async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ err: "Content is required" });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: req.params.commentId }
    });

    if (!comment) {
      return res.status(404).json({ err: "Comment not found" });
    }

    if (comment.userId !== req.user.id) {
      return res.status(403).json({ err: "Not allowed to edit this comment" });
    }

    const updated = await prisma.comment.update({
      where: { id: req.params.commentId },
      data: { content }
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// apagar comentario
commentRouter.delete("/:commentId", verifyToken, async (req, res, next) => {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: req.params.commentId }
    });

    if (!comment) {
      return res.status(404).json({ err: "Comment not found" });
    }

    // pode apagar se for o criador OU admin
    if (comment.userId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ err: "Not allowed to delete this comment" });
    }

    await prisma.comment.delete({
      where: { id: req.params.commentId }
    });

    res.json({ message: "Comment deleted successfully" });
  } catch (err) {
    next(err);
  }
});

export default commentRouter;
