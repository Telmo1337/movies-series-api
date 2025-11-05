import express from "express";
import cors from "cors";
import dotenv from "dotenv";

//routers
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import libraryRouter from "./routes/library.routes.js";
import commentRouter from "./routes/comments.routes.js";
import mediaRouter from "./routes/media.routes.js";

//import middleware global
import { errorHandler } from "./middlewares/errorHandler.js";


//carregar variaveis de ambiente
dotenv.config()


//criar server express
const app = express();

//middleware que permite receber os dados em formato JSON
app.use(express.json())


//configurar cors (permitir coms entre frontend e backend)
//perspetiva para o futuro para implementar frontend neste projeto
app.use(
    cors( {
        origin: "http://localhost:5173",
        credentials: true,
    })
)


//rotas PRINCIPAIS
app.use("/api/v1/auth", authRouter); //rotas de login e registo
app.use("/api/v1/users", userRouter); //rotas de users


app.use("/api/v1/media", mediaRouter); //rotas de filmes/series
app.use("/api/v1/library", libraryRouter); //rotas da biblioteca pessoal
app.use("/api/v1/comments", commentRouter); //rotas de comentários



//rota base
app.get("/", (req, res) =>{
    res.send("FILMES e SÉRIES API")
});


//middleware erros globais
app.use(errorHandler);


//arrancar o servidor
app.listen(process.env.PORT, () => {
    console.log(`Servidor a correr em: http://localhost:${process.env.PORT}`)
})