//ficheiro que representa as rotas de autenticação (registo e login)

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
    firstName: z.string().min(2, "Short name"),
    lastName: z.string().min(2, "Short last name"),
    nickName: z.string()
        .trim()
        .min(2, "Short nickname")
        .regex(/^\S+$/, "Nickname cannot contain spaces"),
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


        const { email, firstName, lastName, nickName, password } = result.data;
        //verificar se o user já existe
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { nickName }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({
                err: existingUser.email === email
                    ? "Email already in use"
                    : "Nickname already in use"
            });
        }


        //verificar se é o primeiro user - atribuir role ADMIN
        const userCount = await prisma.user.count();
        const role = userCount === 0 ? "ADMIN" : "MEMBER";


        //encriptar password HASH PASSWORD
        const hashedPassword = await hashPassword(password);

        //criar user (sempre role MEMBER por defeito)
        const user = await prisma.user.create({
            data: { email, firstName, lastName, nickName, password: hashedPassword, role },
        });

        //criar token jwt
        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role
        });


        //remover o campo password da res
        const { password: _, ...userWithoutPassword } = user;

        //send response
        res.status(201).json({
            user: {
                id: userWithoutPassword.id,
                email: userWithoutPassword.email,
                firstName: userWithoutPassword.firstName,
                lastName: userWithoutPassword.lastName,
                nickName: userWithoutPassword.nickName,
                createdAt: userWithoutPassword.createdAt,
                role: userWithoutPassword.role
            }, token
        });

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
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, firstName: true, lastName: true, nickName: true, password: true, createdAt: true, role: true }
        });
        if (!user) {
            return res.status(404).json({ err: "User not found" })
        }

        //validar password
        const valid = await checkPassword(password, user.password);
        if (!valid) {
            return res.status(401).json({ err: "Incorrect Password" })
        }


        //criar token jwt
        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role
        });


        //hide password
        const { password: _, ...userWithoutPassword } = user;

        //enviar resposta
        res.status(200).json({ user: userWithoutPassword, token })

    } catch (err) {
        next(err)
    }
})


export default authRouter;