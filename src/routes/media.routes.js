import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { verifyToken } from '../utils/auth.js';
import { z } from 'zod';

const mediaRouter = Router();


//schema para criação
//schema for creation
const mediaSchema = z.object({
    title: z.string().min(1, "Title is required"),
    type: z.enum(["MOVIE", "SERIES"]),
    category: z.array(z.string()).min(1, "Category is required"),
    releaseYear: z.coerce.number().min(1900).max(new Date().getFullYear(), "Invalid release year"),
    endYear: z.coerce.number().min(1900).max(new Date().getFullYear()).optional(),
    rating: z.coerce.number().min(0).max(10, "Rating must be between 0 and 10").optional(),
    description: z.string().optional(),
    image: z.string().url("Image must be a valid URL").optional(), // ← agora opcional
});


//schema para atualização
//schema for update
const mediaUpdateSchema = z.object({
    title: z.string().min(1, "Title is required").optional(),
    type: z.enum(["MOVIE", "SERIES"]).optional(),
    category: z.array(z.string()).min(1, "At least one category is required").optional(),
    releaseYear: z.coerce.number().min(1900).max(new Date().getFullYear(), "Invalid release year").optional(),
    endYear: z.coerce.number().min(1900).max(new Date().getFullYear()).optional(),
    rating: z.coerce.number().min(0).max(10, "Rating must be between 0 and 10").optional(),
    description: z.string().optional(),
    image: z.string().url("Image must be a valid URL").optional(),
})
const commentSchema = z.object({
    content: z.string().min(1, "Content is required"),
});


//encontrar filme ou serie por categoria
//find movie or series by category
mediaRouter.get("/bycategory", verifyToken, async (req, res, next) => {
    try {

        //obter categoria da query
        //get category from query
        const { category } = req.query;

        //se não existir, erro
        //if not exist, error
        if (!category || category.trim() === "") {
            return res.status(400).json({ err: "category query parameter is required" });
        }

        //obter todos os media
        //get all media
        const media = await prisma.media.findMany();

        // filtrar em javascript (ja que o prisma nao suporta arrays em queries)
        // filter in javascript (since prisma does not support arrays in queries)
        const filtered = media.filter(item =>
            Array.isArray(item.category) && item.category.includes(category)
        );

        //retornar resultados
        //return results
        res.json({
            success: true,
            count: filtered.length,
            data: filtered
        });

    } catch (err) {
        //erro ao obter media por categoria
        //error getting media by category
        next(err);
    }
});



// Criar comentário para um media
// Create comment for a media
mediaRouter.post("/:mediaId/comments", verifyToken, async (req, res, next) => {
    try {

        //validar dados
        //validate data
        const parse = commentSchema.safeParse(req.body);

        //se dados invalidos, retornar erro
        //if data invalid, return error
        if (!parse.success) {
            return res.status(400).json({ errors: parse.error.flatten().fieldErrors });
        }

        //verificar se o media existe
        //check if media exists
        const { mediaId } = req.params;
        const media = await prisma.media.findUnique({ where: { id: mediaId } });

        //se media não existir, erro
        //if media does not exist, error
        if (!media) return res.status(404).json({ err: "Media not found" });

        //criar comentário
        //create comment
        const comment = await prisma.comment.create({
            data: {
                content: parse.data.content,
                mediaId,
                userId: req.user.id,
            },
        });

        //retornar comentário criado
        //return created comment
        res.status(201).json(comment);
    } catch (err) {
        //erro ao criar comentário
        //error creating comment
        next(err);
    }
});

// Lista de comentários de um media
// List comments of a media
mediaRouter.get("/:mediaId/comments", async (req, res, next) => {
    try {
        //obter comentários
        //get comments
        const comments = await prisma.comment.findMany({
            where: { mediaId: req.params.mediaId },
            include: { user: { select: { id: true, nickName: true } } },
        });

        //retornar comentários
        //return comments
        res.json(comments);
    } catch (err) {
        //erro ao obter comentários
        //error getting comments
        next(err);
    }
});


//criar filme/serie
//create movie/series
mediaRouter.post("/", verifyToken, async (req, res, next) => {
    try {
        //validar dados
        //validate data
        const result = mediaSchema.safeParse(req.body);

        //se dados inválidos, retornar erro
        //if data invalid, return error
        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        //verificar se o media ja existe
        //check if media already exists
        const existingMedia = await prisma.media.findFirst({
            where: { title: result.data.title }
        })

        //se ja existir, retornar erro
        //if already exists, return error
        if (existingMedia) {
            return res.status(400).json({ err: "Media already exists" })
        }

        //criar media
        //create media
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

        //retornar media criado
        //return created media
        res.status(201).json(media);
    } catch (err) {
        //erro ao criar media
        //error creating media
        next(err);
    }
})


//ver todos filmes/series
//view all movies/series
mediaRouter.get("/", verifyToken, async (req, res, next) => {
    try {

        //paginação
        //pagination
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 10;
        const skip = (page - 1) * pageSize;

        const totalMedia = await prisma.media.count();


        //obter todos os media
        //get all media
        const mediaList = await prisma.media.findMany({
            skip,
            take: pageSize,
            include: {
                user: {
                    select: { id: true, nickName: true, }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        //retornar lista de media
        //return media list
        res.json({
            page,
            pageSize,
            totalMedia,
            totalPages: Math.ceil(totalMedia / pageSize),
            count: mediaList.length,
            data: mediaList
        });
    } catch (err) {
        //erro ao obter lista de media
        //error getting media list
        next(err);
    }
});



//ver filme/serie por titulo
//view movie/series by title
mediaRouter.get("/search", verifyToken, async (req, res, next) => {
    try {

        //obter título da query
        //get title from query
        const { title } = req.query;

        //se não existir, erro
        //if not exist, error
        if (!title || title === 'undefined' || title === "null" || title.trim() === "") {
            return res.status(400).json({ err: "Title query parameter is required" });
        }


        //paginação
        //pagination
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 10;
        const skip = (page - 1) * pageSize;

        //obter media por título
        //get media by title
        const where = {
            title: {
                contains: title,
                mode: "insensitive"
            }
        };

        const total = await prisma.media.count({ where });

        const media = await prisma.media.findMany({
            where,
            skip,
            take: pageSize,
            include: { user: { select: { id: true, nickName: true } } },
            orderBy: { createdAt: "desc" },
        });

        
        //se não existir, erro
        //if not exist, error
        if (total === 0) {
            return res.status(404).json({ err: `Media not found ${title}` });
        }


        //retornar media
        //return media
        res.json({
            page,
            pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
            count: media.length,
            data: media
        });
    } catch (err) {
        //erro ao obter media por título
        //error getting media by title
        next(err);
    }
})

//ver filme/serie por id
//view movie/series by id
mediaRouter.get("/:id", verifyToken, async (req, res, next) => {
    try {

        //obter id dos params
        //get id from params
        const { id } = req.params;

        //verificar se o media existe
        //check if media exists
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

        //se não existir, erro
        //if not exist, error
        if (!media) {
            return res.status(404).json({ err: "Media not found" });
        }

        //retornar media
        //return media
        res.json(media);

    } catch (err) {
        //erro ao obter media por id
        //error getting media by id
        next(err);
    }
})

//atualizar filme/serie
//update movie/series
mediaRouter.put("/:id", verifyToken, async (req, res, next) => {
    try {

        //obter id dos params
        //get id from params
        const { id } = req.params;
        //validar dados
        //validate data
        const result = mediaUpdateSchema.safeParse(req.body);
        //se dados inválidos, retornar erro
        //if data invalid, return error
        if (!result.success) {
            return res.status(400).json({ errors: result.error.errors });
        }

        //verificar se o media existe
        //check if media exists
        const media = await prisma.media.findUnique({
            where: { id }
        })
        //se não existir, erro
        //if not exist, error
        if (!media) {
            return res.status(404).json({ err: "Media not found" });
        }

        //verificar se o user é o criador do media
        //check if user is the creator of the media
        if (media.userId !== req.user.id) {
            return res.status(403).json({ err: "You are not authorized to update this media" });
        }

        //atualizar media
        //update media
        const updatedMedia = await prisma.media.update({
            where: { id },
            data: result.data,
        });

        //retornar media atualizado
        //return updated media
        res.json(updatedMedia);

    } catch (err) {
        //erro ao atualizar media
        //error updating media
        next(err);
    }
})


//apagar filme/serie
//delete movie/series
mediaRouter.delete("/:id", verifyToken, async (req, res, next) => {
    try {

        //obter id dos params
        //get id from params
        const { id } = req.params;

        //verificar se o media existe
        //check if media exists
        const media = await prisma.media.findUnique({
            where: { id }
        })

        //se não existir, erro
        //if not exist, error
        if (!media) {
            return res.status(404).json({ err: "Media not found" });
        }

        //verificar se o user é o criador do media
        //check if user is the creator of the media
        if (media.userId !== req.user.id && req.user.role !== "ADMIN") {
            return res.status(403).json({ err: "You are not authorized to delete this media" });
        }

        //apagar associações na userMedia e comments primeiro
        //delete associations in userMedia and comments first
        await prisma.userMedia.deleteMany({
            where: { mediaId: id }
        });

        await prisma.comment.deleteMany({
            where: { mediaId: id }
        });

        //apagar media
        //delete media
        await prisma.media.delete({
            where: { id }
        });

        //retornar sucesso
        //return success
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
        //erro ao apagar media
        //error deleting media
        next(err);
    }
})


export default mediaRouter;