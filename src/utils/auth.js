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
        {id: payload.id, email:payload.email, role: payload.role}, //dados codificados
        process.env.JWT_SECRET, // secret key do .env
        { expiresIn: "7d"} //tempo de validade do token
     )


     console.log("Token created: ", token)
     return token;
}


//middleware to verify token
export const verifyToken = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return res.status(401).json({err: "No token provided"});
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ err: "Invalid token" });
    }
}


//middleware to require admin role
export function requireAdmin(req, res, next) {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ err: "Access denied. Admins only." });
  }
  next();
}


