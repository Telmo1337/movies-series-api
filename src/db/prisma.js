//importar o client
import {PrismaClient} from "@prisma/client";


//criar uma instância que será usada em todo o projeto para interagir
//com a base de dados através do prisma
export const prisma = new PrismaClient();