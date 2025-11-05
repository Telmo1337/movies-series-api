import {Router} from 'express';
import {prisma} from '../db/prisma.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import {z } from 'zod';

const mediaRouter = Router();


//schema para validação
const mediaSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["MOVIE", "SERIES"]),
  category: z.string().min(1, "Category is required"),
  releaseYear: z.number().min(1900).max(new Date().getFullYear(), "Invalid release year"),
  endYear: z.number().min(1900).max(new Date().getFullYear()).optional(),
  rating: z.number().min(0).max(10, "Rating must be between 0 and 10").optional(),
  description: z.string().optional(),
  image: z.string().url("Image must be a valid URL").optional(), // ← agora opcional
});


//criar filme/serie
mediaRouter.post("/", verifyToken, async(req, res, next) => {
    try {
        //validar dados
        const result = mediaSchema.safeParse(req.body);
        //se dados validos, criar na bd
        if(!result.success){
            return res.status(400).json({errors: result.error.errors});
        }

        //verificar se o media ja existe
        const existingMedia = await prisma.media.findUnique({
            where: {title: result.data.title}
        })

        if (existingMedia) {
            return res.status(400).json({ err: "Media already exists" })
        }

        const media = await prisma.media.create({data: result.data})
        res.status(201).json(media);
    }catch (err) {
        next(err);
    }
})


//ver todos filmes/series
mediaRouter.get("/", verifyToken,  async(req, res, next) => {
    try {
        //buscar na bd
        const mediaList =  await prisma.media.findMany();
        //retornar dados
        res.json(mediaList);
    } catch (err) {
        next(err);
    }
});


//ver filme/serie por id
mediaRouter.get("/:id", verifyToken, async(req, res, next) => {
    try{

        //buscar na bd
        const media = await prisma.media.findUnique({
            where: {id:req.params.id },
            include: {comments: true}
        });
        
        //se nao encontrar, retornar erro
        if(!media) {
            return res.status(404).json({err: "Media not found"});
        }
        //se encontrar, retornar dados
        res.json(media);
    }catch(err){
        next(err);
    }
})


export default mediaRouter;