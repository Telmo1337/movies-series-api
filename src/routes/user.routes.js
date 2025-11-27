//importar express router
//import express router
import { Router } from "express";

//importar prisma client
//import prisma client
import { prisma } from "../db/prisma.js";

//importar funções de autenticação
//import authentication functions
import { verifyToken, requireAdmin } from "../utils/auth.js";


//criar router
//create router
const userRouter = Router();


//rota apenas para role ADMIN - ver todos os users
//route only for ADMIN role - view all users
userRouter.get("/", verifyToken, requireAdmin, async (req, res, next) => {
  try {

    //paginação
    //pagination
    const page = Number(req.query.page) || 1;          // página atual // current page
    const pageSize = Number(req.query.pageSize) || 10; // itens por página // items per page
    const skip = (page - 1) * pageSize;                // calcular início da página // calculate offset


    //total de utilizadores
    //total number of users
    const totalUsers = await prisma.user.count();


    //retornar apenas os campos seguros
    //return only safe fields
    const users = await prisma.user.findMany({
      skip,            // ignorar X itens // skip X items
      take: pageSize,  // obter apenas pageSize itens // get pageSize items
      select: {
        id: true,
        firstName: true,
        lastName: true,
        nickName: true,
        email: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" } // ordenar pelos mais recentes // sort by newest
    });


    //enviar resposta com meta-dados de paginação
    //send response with pagination metadata
    res.status(200).json({
      page,
      pageSize,
      totalUsers,
      totalPages: Math.ceil(totalUsers / pageSize),
      count: users.length,
      data: users
    });

  } catch (err) {
    //erro ao obter lista de users
    //error getting user list
    next(err);
  }
});




//ver medias criados de um user pelo nickName
//view media created by a user by nickName
userRouter.get("/:nickName/media", verifyToken, async (req, res, next) => {
  try {

    const { nickName } = req.params;

    //paginação
    //pagination
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;


    //encontrar o user pelo nickName
    //find the user by nickName
    const user = await prisma.user.findUnique({
      where: { nickName },
      select: { id: true, nickName: true }
    });

    //se o user não existir
    //if the user does not exist
    if (!user) {
      return res.status(404).json({ err: "User not found" });
    }


    //total de media criados por este user
    //total media items created by this user
    const totalMedia = await prisma.media.count({
      where: { userId: user.id }
    });


    //encontrar media criados por esse user
    //find media created by that user
    const mediaList = await prisma.media.findMany({
      where: { userId: user.id },
      skip,        // ignorar X // skip X
      take: pageSize,
      include: {
        user: { select: { id: true, nickName: true } }
      },
      orderBy: { createdAt: "desc" }
    });


    //retornar a lista de media paginada
    //return paginated media list
    res.json({
      user: user.nickName,
      page,
      pageSize,
      totalMedia,
      totalPages: Math.ceil(totalMedia / pageSize),
      count: mediaList.length,
      data: mediaList
    });

  } catch (err) {
    //erro ao obter medias do user
    //error getting user's media
    next(err);
  }
});



export default userRouter;
