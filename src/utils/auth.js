//importar bibliotecas
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

//funções de segurança e autenticação

//função para encriptar passwords antes de guardar na base de dados
export async function hashPassword(password){

    return await bcrypt.hash(password, 12) //string, salt rounds
}


//verificar se a password inserida coincide com o hash guardado
export async function checkPassword(password, hashedPassword) {
    
    return await bcrypt.compare(password, hashedPassword)
}

//criar um token para ser usado no login
export function generateToken(payload){
    
    const token = jwt.sign(
        {id: payload.id, email:payload.email}, //dados codificados
        process.env.JWT_SECRET, // secret key do .env
        { expiresIn: "7d"} //tempo de validade do token
     )


     console.log("Token created: ", token)
     return token;
}


//middleware para proteger as rotas (verificação do token se é válido)
export async function authGuard (req, res, next) {
    

    const authHeader = req.headers.authorization;

    //o token vem no header "Authorization: Bearer (e o token)"
    if(!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({err: "Token not given"})
    }

    const token = authHeader.split(" ")[1]; //retira apenas o token

    try{

        //verificar se o token é válido
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        //armazenar os dados do user decoded no objeto req
        req.user = decoded;

        //avança para a rota seguinte
        next();

    }catch(err){
        console.log(err);
        return res.status(403).json({err: "Invalid or expired token"})
    }

}


