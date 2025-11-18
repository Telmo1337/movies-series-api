import {Router} from "express";
import { prisma } from "../db/prisma.js";
import { verifyToken, requireAdmin } from "../utils/auth.js";


const userRouter = Router();

//rota apenas para role ADMIN - ver todos os users
userRouter.get("/", verifyToken, requireAdmin, async(req,res, next)=>{
    try {
        //retornar apenas os campos seguros
        const users = await prisma.user.findMany({
            select: {id: true, firstName: true, lastName: true, nickName: true, email: true, createdAt: true},
        })

        res.status(200).json(users)

    }catch(err){
        next()
    }
});


//ver medias criados de um user pelo nickName
userRouter.get("/:nickName/media", verifyToken, async (req, res, next) => {
  try {
    const { nickName } = req.params;

    // verificar se o user existe
    const user = await prisma.user.findUnique({
      where: { nickName },
      select: { id: true, nickName: true }
    });

    if (!user) {
      return res.status(404).json({ err: "User not found" });
    }

    // buscar media criados por esse user
    const mediaList = await prisma.media.findMany({
      where: { userId: user.id },
      include: {
        user: { select: { id: true, nickName: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(mediaList);
  } catch (err) {
    next(err);
  }
});




export default userRouter;