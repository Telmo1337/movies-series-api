import {Router} from 'express';
import {prisma} from '../db/prisma.js';
import { verifyToken } from '../middlewares/verifyToken.js';


const libraryRouter = Router();


//adicionar à bilbioteca
libraryRouter.post("/:mediaId", verifyToken, async(req, res, next) => {
    try{

       
        const userId = req.user.id;
        const mediaId = Number(req.params.mediaId);

        const existingEntry = await prisma.userMedia.findUnique({
            where: {userId_mediaId: {userId, mediaId}}
        });

        //se ja existir, retornar erro
        if(existingEntry){
            return res.status(400).json({err: "Media already in library"});
        }

        const userMedia = await prisma.userMedia.create({
            data: {userId, mediaId}
        });

        
        //adicionar à biblioteca
        res.status(201).json(userMedia);
    }catch(err){
        next(err);
    }
})



// atualizar estado (favorito, visto, rating, etc.)
libraryRouter.put("/:mediaId", verifyToken, async(req, res, next) => {
    try{
        
        const {favorite, watched, rating, notes, calendarAt } = req.body;
        const updated = await prisma.userMedia.update({
            where: {
                userId_mediaId: {
                    userId: req.user.id,
                    mediaId: req.params.mediaId
                }
            },

            data: {favorite, watched, rating, notes, calendarAt}
        })

        res.json(updated);

    } catch(err){
        next(err);
    }
})



//lista 
libraryRouter.get("/", verifyToken, async (req, res, next) => {
  try {
    const library = await prisma.userMedia.findMany({
      where: { userId: req.user.id },
      include: { media: true },
    });
    res.json(library);
  } catch (err) {
    next(err);
  }
});

export default libraryRouter;