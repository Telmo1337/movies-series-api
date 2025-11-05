import {Router} from "express";
import { prisma } from "../db/prisma.js";
import { authGuard } from "../utils/auth.js";


const userRouter = Router();


userRouter.get("/", async (req, res,next) =>{
    //get all users
    try{
        const users = await prisma.user.findMany();
        res.status(200).json(users)
    }catch(err){
        next()
    }
})



/*//protected user list
userRouter.get("/", authGuard, async(req,res, next)=>{
    try {

        //retornar apenas os campos seguros
        const users = await prisma.user.findMany({
            select: {id: true, name: true, email: true, createdAt: true},
        })

        res.status(200).json(users)

    }catch(err){
        next()
    }
})*/


export default userRouter;