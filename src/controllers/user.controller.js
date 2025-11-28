// Controller: recebe pedidos HTTP e delega para a camada de serviços

import { z } from "zod";

//importar funções de serviço
//import service functions
import {
  getUserProfileService,
  getAllUsersService,
  getUserMediaService,
  updateUserProfileService,
  updateUserPrivacyService,
  updateUserAvatarService
} from "../services/user.service.js";


//importar schemas para validação
//import schemas for validation
import {
  updateAvatarSchema,
  updatePrivacySchema,
  updateProfileSchema
} from "../schemas/user.schema.js";
//import função de validação
//import validation function
import { validateSchema } from "../utils/validation.js";


// ============================
// VER PERFIL COM PRIVACIDADE
// ============================
export async function getUserProfile(req, res, next) {
  try {
    const { nickName } = validateSchema(
      z.object({ nickName: z.string().min(1, "Nickname is required") }),
      req.params
    );

    const result = await getUserProfileService(nickName, req.user);

    return res.json(result);

  } catch (err) {
    next(err);
  }
}


// ============================
// LISTAR USERS (ADMIN)
// ============================
export async function getAllUsers(req, res, next) {
  try {
    const { page, pageSize } = req.query;

    const result = await getAllUsersService(page, pageSize);

    return res.json(result);

  } catch (err) {
    next(err);
  }
}


// ============================
// VER MEDIA DE UM USER
// ============================
export async function getUserMedia(req, res, next) {
  try {
  
    const { nickName } = validateSchema(
      z.object({ nickName: z.string().min(1, "Nickname is required") }),
      req.params
    );
    const { page, pageSize } = req.query;

    const result = await getUserMediaService(nickName, page, pageSize);

    return res.json(result);

  } catch (err) {
    next(err);
  }
}


// ============================
// ATUALIZAR PERFIL
// ============================
export async function updateProfile(req, res, next) {
  try {
    const body = validateSchema(updateProfileSchema, req.body);
    const result = await updateUserProfileService(req.user.id, body);

    return res.json(result);

  } catch (err) {
    next(err);
  }
}


// ============================
// ATUALIZAR PRIVACIDADE
// ============================
export async function updatePrivacy(req, res, next) {
  try {
    const { privacy } = validateSchema(updatePrivacySchema, req.body);
    const result = await updateUserPrivacyService(req.user.id, privacy);

    return res.json(result);

  } catch (err) {
    next(err);
  }
}


// ============================
// ATUALIZAR AVATAR
// ============================
export async function updateAvatar(req, res, next) {
  try {
    const { avatar } = validateSchema(updateAvatarSchema, req.body);
    const result = await updateUserAvatarService(req.user.id, avatar);

    return res.json({ 
      
      message: "Avatar updated successfully" 

    });

  } catch (err) {
    next(err);
  }
}
