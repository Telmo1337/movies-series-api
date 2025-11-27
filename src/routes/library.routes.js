import {Router} from 'express';
import {prisma} from '../db/prisma.js';
import { verifyToken } from '../utils/auth.js';


const libraryRouter = Router();


// biblioteca pública de outro utilizador
// public library of another user
libraryRouter.get("/user/:nickName", verifyToken,async (req, res, next) => {
  try {
    const { nickName } = req.params;

    // procurar utilizador pelo nickName
    // find user by nickName
    const user = await prisma.user.findUnique({
      where: { nickName },
      select: { id: true, nickName: true }
    });

    if (!user) {
      return res.status(404).json({ err: "User not found" });
    }

    // obter biblioteca filtrada (pública)
    // get filtered public library
    const publicLibrary = await prisma.userMedia.findMany({
      where: { userId: user.id },
      select: {
        watched: true,
        rating: true,
        favorite: true,   // opcional, podes tirar se quiseres
        media: {
          select: {
            id: true,
            title: true,
            image: true,
            type: true,
            description: true
          }
        }
      }
    });

    // responder com biblioteca pública
    // return public library
    res.status(200).json({
      user: user.nickName,
      count: publicLibrary.length,
      library: publicLibrary
    });

  } catch (err) {
    next(err);
  }
});


//estatisticas da biblioteca do utilizador
//user library statistics
libraryRouter.get("/stats", verifyToken,  async(req, res, next) => {
    try {

        //obter estatisticas da biblioteca
        //get library statistics
        const userId = req.user.id;

        //obter todos os items da biblioteca do user
        //get all items from user's library
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
        //calculate statistics
        const total = libraryStats.length;
        
        //contar favoritos, vistos, com notas, agendados
        //count favorites, watched, with notes, scheduled
        const favorites = libraryStats.filter(item => item.favorite === true).length;
        const watched = libraryStats.filter(item => item.watched === true).length;
        const withNotes = libraryStats.filter(item => item.notes && item.notes.trim() !== '').length;
        const scheduled = libraryStats.filter(item => item.calendarAt !== null).length;
        const ratings = libraryStats.filter(item => typeof item.rating === 'number');

        //calcular rating médio
        //calculate average rating
        const averageRating = 
            ratings.length > 0
            ? (ratings.reduce((acc, cur) => acc + cur.rating, 0) / ratings.length).toFixed(1) 
            : null;


        //retornar estatisticas
        //return statistics
        res.json({
            totalMedia: total,
            favorites,
            watched,
            withNotes,
            scheduled,
            averageRating: averageRating ? Number(averageRating) : null,
        });

    }catch(err){
        //erro ao obter estatisticas
        //error getting statistics
        next(err);
    }
});

//obter lista de favoritos
//favorite list
libraryRouter.get("/favorites", verifyToken, async(req, res, next) => {
    try{
        //obter favoritos do user
        //get user's favorites
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

        //retornar favoritos
        //return favorites
        res.json(favorites);


    } catch(err){
        //erro ao obter favoritos
        //error getting favorites
        next(err);
    }
});


//watched list
libraryRouter.get("/watched", verifyToken, async(req, res, next) => {
    try{

        //obter vistos do user
        //get user's watched
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

        //retornar vistos
        //return watched
        res.json(watched);

    } catch(err){
        //erro ao obter vistos
        //error getting watched
        next(err);
    }
});





//lista da biblioteca do user
//list of library items
libraryRouter.get("/", verifyToken, async (req, res, next) => {
  try {
    //obter biblioteca do user
    //get user's library
    const library = await prisma.userMedia.findMany({
      where: { userId: req.user.id },
      include: { media: true },
    });

    //retornar biblioteca
    //return library
    res.json(library);
  } catch (err) {
    //erro ao obter biblioteca
    //error getting library
    next(err);
  }
});



// atualizar estado (favorito, visto, rating, etc.)
// update status (favorite, watched, rating, etc.)
libraryRouter.put("/:mediaId", verifyToken, async(req, res, next) => {
    try{
        
        //obter dados do corpo da requisição
        //get data from request body
        const {favorite, watched, rating, notes, calendarAt } = req.body;
        //atualizar entrada na biblioteca
        //update library entry
        const updated = await prisma.userMedia.update({
            where: {
                userId_mediaId: {
                    userId: req.user.id,
                    mediaId: req.params.mediaId
                }
            },

            data: {favorite, watched, rating, notes, calendarAt}
        })

        //retornar entrada atualizada
        //return updated entry
        res.json(updated);

    } catch(err){
        //erro ao atualizar entrada
        //error updating entry
        next(err);
    }
})

//adicionar à bilbioteca
//add to library
libraryRouter.post("/:mediaId", verifyToken, async(req, res, next) => {
    try{

        //obter dados do corpo da requisição
        //get data from request body
        const userId = req.user.id;
        const mediaId = req.params.mediaId; 

        const existingEntry = await prisma.userMedia.findUnique({
            where: {userId_mediaId: {userId, mediaId}}
        });

        //se ja existir, retornar erro
        //if already exists, return error
        if(existingEntry){
            return res.status(400).json({err: "Media already in library"});
        }


        //criar entrada na biblioteca
        //create library entry
        const userMedia = await prisma.userMedia.create({
            data: {userId, mediaId}
        });

        
        //adicionar à biblioteca
        //add to library
        res.status(201).json(userMedia);
    }catch(err){
        //erro ao adicionar à biblioteca
        //error adding to library
        next(err);
    }
});





//remover um media da biblioteca do user (mas nao da bd)
//remove a media from user's library (but not from db)
libraryRouter.delete("/:mediaId", verifyToken, async (req, res, next) => {
    try{
        //remover da biblioteca
        //remove from library
        await prisma.userMedia.delete({
            where: {
                userId_mediaId: {
                    userId: req.user.id,
                    mediaId: req.params.mediaId,
                },
            },
        });

        //retornar sucesso
        //return success
        res.status(200).json({message: "Media removed from library"});
    }catch(err){
        //erro ao remover da biblioteca
        //error removing from library
        next(err);
    }
})

export default libraryRouter;