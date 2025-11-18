import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { verifyToken } from '../utils/auth.js';
import { z } from 'zod';

const mediaRouter = Router();


//schema para criação
const mediaSchema = z.object({
    title: z.string().min(1, "Title is required"),
    type: z.enum(["MOVIE", "SERIES"]),
    category: z.string().min(1, "Category is required"),
    releaseYear: z.coerce.number().min(1900).max(new Date().getFullYear(), "Invalid release year"),
    endYear: z.coerce.number().min(1900).max(new Date().getFullYear()).optional(),
    rating: z.coerce.number().min(0).max(10, "Rating must be between 0 and 10").optional(),
    description: z.string().optional(),
    image: z.string().url("Image must be a valid URL").optional(), // ← agora opcional
});


//schema para atualização
const mediaUpdateSchema = z.object({
    title: z.string().min(1, "Title is required").optional(),
    type: z.enum(["MOVIE", "SERIES"]).optional(),
    category: z.string().min(1, "Category is required").optional(),
    releaseYear: z.coerce.number().min(1900).max(new Date().getFullYear(), "Invalid release year").optional(),
    endYear: z.coerce.number().min(1900).max(new Date().getFullYear()).optional(),
    rating: z.coerce.number().min(0).max(10, "Rating must be between 0 and 10").optional(),
    description: z.string().optional(),
    image: z.string().url("Image must be a valid URL").optional(),
})
const commentSchema = z.object({
  content: z.string().min(1, "Content is required"),
});

// Criar comentário para um media
mediaRouter.post("/:mediaId/comments", verifyToken, async (req, res, next) => {
  try {
    const parse = commentSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ errors: parse.error.flatten().fieldErrors });
    }

    const { mediaId } = req.params;

    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) return res.status(404).json({ err: "Media not found" });

    const comment = await prisma.comment.create({
      data: {
        content: parse.data.content,
        mediaId,
        userId: req.user.id,
      },
    });

    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

// Listar comentários de um media
mediaRouter.get("/:mediaId/comments", async (req, res, next) => {
  try {
    const comments = await prisma.comment.findMany({
      where: { mediaId: req.params.mediaId },
      include: { user: { select: { id: true, nickName: true } } },
    });

    res.json(comments);
  } catch (err) {
    next(err);
  }
});


//criar filme/serie
mediaRouter.post("/", verifyToken, async (req, res, next) => {
    try {
        //validar dados
        const result = mediaSchema.safeParse(req.body);
        //se dados validos, criar na bd
        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        //verificar se o media ja existe
        const existingMedia = await prisma.media.findFirst({
            where: { title: result.data.title }
        })



        if (existingMedia) {
            return res.status(400).json({ err: "Media already exists" })
        }

        const media = await prisma.media.create({
            data: {
                ...result.data,
                userId: req.user.id,
            },
            include: {
                user: {
                    select: { id: true, nickName: true }
                }
            }
        });

        res.status(201).json(media);
    } catch (err) {
        next(err);
    }
})


//ver todos filmes/series
mediaRouter.get("/", verifyToken, async (req, res, next) => {
    try {
        //buscar na bd
        const mediaList = await prisma.media.findMany({
            include: {
                user: {
                    select: { id: true, nickName: true, }
                }
            },
            orderBy: { createdAt: 'desc' },
        });
        //retornar dados
        res.json(mediaList);
    } catch (err) {
        next(err);
    }
});



//ver filme/serie por titulo
mediaRouter.get("/search", verifyToken, async (req, res, next) => {
    try {
        const { title } = req.query;

        if (!title || title === 'undefined' || title === "null" || title.trim() === "") {
            return res.status(400).json({ err: "Title query parameter is required" });
        }

        const media = await prisma.media.findMany({
            where: { title: { contains: title } },
            include: { user: { select: { id: true, nickName: true } } },
            orderBy: { createdAt: 'desc' },
        });

        if (media.length === 0) {
            return res.status(404).json({ err: `Media not found ${title}` });
        }

        res.json(media);
    } catch (err) {
        next(err);
    }
})

//ver filme/serie por id
mediaRouter.get("/:id", verifyToken, async (req, res, next) => {
    try {

        const { id } = req.params;

        //ir a bd
        const media = await prisma.media.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        nickName: true
                    }
                }
            }
        });

        if (!media) {
            return res.status(404).json({ err: "Media not found" });
        }

        res.json(media);

    } catch (err) {
        next(err);
    }
})

//atualizar filme/serie
mediaRouter.put("/:id", verifyToken, async (req, res, next) => {
    try {

        const { id } = req.params;
        const result = mediaUpdateSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        const media = await prisma.media.findUnique({
            where: { id }
        })

        if (!media) {
            return res.status(404).json({ err: "Media not found" });
        }

        if (media.userId !== req.user.id) {
            return res.status(403).json({ err: "You are not authorized to update this media" });
        }

        const updatedMedia = await prisma.media.update({
            where: { id },
            data: result.data,
        });

        res.json(updatedMedia);

    } catch (err) {
        next(err);
    }
})



//delete filme/serie
mediaRouter.delete("/:id", verifyToken, async (req, res, next) => {
    try {

        const { id } = req.params;

        //verificar se o media existe
        const media = await prisma.media.findUnique({
            where: { id }
        })

        if (!media) {
            return res.status(404).json({ err: "Media not found" });
        }

        //verificar se o user é o criador do media
        if (media.userId !== req.user.id && req.user.role !== "ADMIN") {
            return res.status(403).json({ err: "You are not authorized to delete this media" });
        }

        //apagar media
        await prisma.userMedia.deleteMany({
            where: { mediaId: id }
        });
        //apagar comentarios associados
        await prisma.comment.deleteMany({
            where: { mediaId: id }
        });
        //apagar o media
        await prisma.media.delete({
            where: { id }
        });

        res.status(200).json({
            message: "Media deleted successfully",
            deletedMedia: {
                id: media.id,
                title: media.title,
                type: media.type
            },
            deletedBy: req.user.nickName

        });


    } catch (err) {
        next(err);
    }
})


export default mediaRouter;