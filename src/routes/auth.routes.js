//importar dependencias
import { Router } from "express";
import { prisma } from "../db/prisma.js";
import { hashPassword, checkPassword, generateToken } from "../utils/auth.js";
import { z } from "zod";


//criar router
const authRouter = Router();


//validar os dados para o registo
const registerSchema = z.object({
    email: z.string().email("Invalid email"),
    name: z.string().min(2, "Short name"),
    password: z.string().min(6, "Your password must have at least 6 caracters"),

});


//validação dos dados para o login
const loginSchema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(1, "Password is required"),
});


//rota registar
authRouter.post("/register", async (req, res, next) => {
    try {
        //validar dados com o zod
        const result = registerSchema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ errors: result.error.flatten().fieldErrors })
        }


        const { email, name, password } = result.data;

        //verificar se o user já existe
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ err: "Email already in use" })
        }


        //encriptar password HASH PASSWORD
        const hashedPassword = await hashPassword(password);

        //criar user
        const user = await prisma.user.create({
            data: { email, name, password: hashedPassword },
        });

        //criar token jwt
        const token = generateToken(user);

        //remover o campo password da res
        const { password: _, ...userWithoutPassword } = user;

        //send response
        res.status(201).json({ user: userWithoutPassword, token });

    } catch (err) {
        next(err);
    } 
})



//rota login
authRouter.post('/login', async (req, res, next) => {
    try {

        //validar dados zod
        const result = loginSchema.safeParse(req.body)
        if (!result.success) {
            return res.status(400).json({ errors: result.error.flatten().fieldErrors })
        }

        const { email, password } = result.data;

        //verificar se o user já existe
        const user = await prisma.user.findUnique({ where: {email} });
        if (!user) {
            return res.status(404).json({ err: "User not found" })
        }

        //validar password
        const valid = await checkPassword(password, user.password);
        if (!valid) {
            return res.status(401).json({ err: "Incorrect Password" })
        }


        //criar token jwt
        const token = generateToken(user);

        //hide password
        const { password: _, ...userWithoutPassword } = user;

        //enviar resposta
        res.status(200).json({ user: userWithoutPassword, token })

    } catch (err) {
        console.error(err);
        next(err)
    }
})


export default authRouter;