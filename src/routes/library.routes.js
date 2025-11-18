import {Router} from 'express';
import {prisma} from '../db/prisma.js';
import { verifyToken } from '../utils/auth.js';


const libraryRouter = Router();

//estatisticas da biblioteca do utilizador
libraryRouter.get("/stats", verifyToken,  async(req, res, next) => {
    try {
        const userId = req.user.id;

        const libraryStats = await prisma.userMedia.findMany({
            where: {userId},
            select: {
                favorite: true,
                watched: true,
                rating: true,
                notes: true,
                calendarAt: true
            }
        });

        //calcular estatisticas
        const total = libraryStats.length;
        
        const favorites = libraryStats.filter(item => item.favorite === true).length;
        const watched = libraryStats.filter(item => item.watched === true).length;
        const withNotes = libraryStats.filter(item => item.notes && item.notes.trim() !== '').length;
        const scheduled = libraryStats.filter(item => item.calendarAt !== null).length;

        const ratings = libraryStats.filter(item => typeof item.rating === 'number');

        const averageRating = 
            ratings.length > 0
            ? (ratings.reduce((acc, cur) => acc + cur.rating, 0) / ratings.length).toFixed(1) 
            : null;


        res.json({
            totalMedia: total,
            favorites,
            watched,
            withNotes,
            scheduled,
            averageRating: averageRating ? Number(averageRating) : null,
        });

    }catch(err){
        next(err);
    }
});

//obter lista de favoritos
libraryRouter.get("/favorites", verifyToken, async(req, res, next) => {
    try{
        const userId = req.user.id;

        const favorites = await prisma.userMedia.findMany({
            where: {
                userId,
                favorite: true
            },
            include: {
                media: true
            }
        })

        res.json(favorites);


    } catch(err){
        next(err);
    }
});


//watched list
libraryRouter.get("/watched", verifyToken, async(req, res, next) => {
    try{

        const userId = req.user.id;

        const watched = await prisma.userMedia.findMany({
            where: {
                userId,
                watched: true
            },
            include: {
                media: true
            }
        })

        res.json(watched);

    } catch(err){
        next(err);
    }
});





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

//adicionar à bilbioteca
libraryRouter.post("/:mediaId", verifyToken, async(req, res, next) => {
    try{

       
        const userId = req.user.id;
        const mediaId = req.params.mediaId; 

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
});





//remover um media da biblioteca do user (mas nao da bd)
libraryRouter.delete("/:mediaId", verifyToken, async (req, res, next) => {
    try{
        await prisma.userMedia.delete({
            where: {
                userId_mediaId: {
                    userId: req.user.id,
                    mediaId: req.params.mediaId,
                },
            },
        });

        res.status(200).json({message: "Media removed from library"});
    }catch(err){
        next(err);
    }
})

export default libraryRouter;