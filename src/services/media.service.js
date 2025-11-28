// Camada de serviços responsável pela lógica de filmes/séries (media)
// Aqui concentram-se todas as operações sobre media, comentários, ranking, etc.

import { prisma } from "../db/prisma.js";
import { mediaSchema, mediaUpdateSchema, commentSchema } from "../schemas/media.schema.js";


// ========================================================
//  TOP 10 MOVIES BASEADO NAS MÉDIAS DO userMedia
// ========================================================
export async function getTopMoviesService() {

  // 1. Obter ranking global ordenado pela média mais alta
  const ranking = await prisma.userMedia.groupBy({
    by: ["mediaId"],
    _avg: { rating: true },
    where: { rating: { not: null } },
    orderBy: { _avg: { rating: "desc" } }
  });

  // 2. Extrair IDs ordenados
  const orderedIds = ranking.map(r => r.mediaId);

  // 3. Buscar media que sejam MOVIES mantendo a mesma ordem
  const movies = await prisma.media.findMany({
    where: { id: { in: orderedIds }, type: "MOVIE" }
  });

  // 4. Reordenar conforme a ordem original do ranking
  const orderedMovies = movies.sort(
    (a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id)
  );

  return {
    category: "MOVIES",
    count: orderedMovies.length,
    top10: orderedMovies.slice(0, 10)
  };
}



// ========================================================
//  TOP 10 SERIES BASEADO NAS MÉDIAS
// ========================================================
export async function getTopSeriesService() {

  const ranking = await prisma.userMedia.groupBy({
    by: ["mediaId"],
    _avg: { rating: true },
    where: { rating: { not: null } },
    orderBy: { _avg: { rating: "desc" } }
  });

  const orderedIds = ranking.map(r => r.mediaId);

  const series = await prisma.media.findMany({
    where: { id: { in: orderedIds }, type: "SERIES" }
  });

  const orderedSeries = series.sort(
    (a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id)
  );

  return {
    category: "SERIES",
    count: orderedSeries.length,
    top10: orderedSeries.slice(0, 10)
  };
}



// ========================================================
//  RANKING GLOBAL (TODOS OS MEDIA ORDENADOS PELA MÉDIA)
// ========================================================
export async function getGlobalRankingService() {

  const rankings = await prisma.userMedia.groupBy({
    by: ["mediaId"],
    _avg: { rating: true },
    where: { rating: { not: null } },
    orderBy: { _avg: { rating: "desc" } }
  });

  const ids = rankings.map(r => r.mediaId);

  const media = await prisma.media.findMany({
    where: { id: { in: ids } }
  });

  return {
    total: media.length,
    data: media
  };
}



// ========================================================
//  OBTER MEDIA POR CATEGORIA (FILTRA EM JS)
// ========================================================
export async function getMediaByCategoryService(category) {

  if (!category || category.trim() === "") {
    throw new Error("category query parameter is required");
  }

  // Prisma não suporta contains em array → buscar tudo e filtrar manualmente
  const allMedia = await prisma.media.findMany();

  const filtered = allMedia.filter(
    item => Array.isArray(item.category) && item.category.includes(category)
  );

  return {
    success: true,
    count: filtered.length,
    data: filtered
  };
}



// ========================================================
//  CRIAR COMENTÁRIO
// ========================================================
export async function createCommentService(mediaId, body, user) {

  // Validar corpo do pedido
  const parse = commentSchema.safeParse(body);
  if (!parse.success) {
    throw new Error(parse.error.flatten().fieldErrors.content?.[0]);
  }

  // Validar media
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media) throw new Error("Media not found");

  // Criar comentário
  const comment = await prisma.comment.create({
    data: {
      content: parse.data.content,
      mediaId,
      userId: user.id
    }
  });

  return comment;
}



// ========================================================
//  LISTAR COMENTÁRIOS DE UM MEDIA
// ========================================================
export async function listCommentsService(mediaId) {

  const comments = await prisma.comment.findMany({
    where: { mediaId },
    include: {
      user: { select: { id: true, nickName: true } }
    }
  });

  return comments;
}



// ========================================================
//  CRIAR MEDIA (MOVIE / SERIES)
// ========================================================
export async function createMediaService(body, user) {
  if (user.role !== "ADMIN") {
    throw new Error("Only admins can create media");
  }

  const result = mediaSchema.safeParse(body);
  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }

  const exists = await prisma.media.findFirst({
    where: { title: result.data.title }
  });

  if (exists) throw new Error("Media already exists");

  const media = await prisma.media.create({
    data: {
      ...result.data,
      userId: user.id // quem criou
    },
    include: {
      user: { select: { id: true, nickName: true } }
    }
  });

  return media;
}


// ========================================================
//  LISTAR TODOS OS MEDIA COM PAGINAÇÃO + SORTING
// ========================================================
export async function listAllMediaService(query) {

  let { page = 1, pageSize = 10, sort = "createdAt", order = "desc" } = query;

  page = Number(page);
  pageSize = Number(pageSize);
  order = order === "asc" ? "asc" : "desc";

  const validSort = ["title", "releaseYear", "rating", "createdAt"];
  if (!validSort.includes(sort)) throw new Error("Invalid sort field");

  const skip = (page - 1) * pageSize;

  const mediaList = await prisma.media.findMany({
    skip,
    take: pageSize,
    orderBy: { [sort]: order },
    include: {
      user: { select: { nickName: true } }
    }
  });

  const totalMedia = await prisma.media.count();

  return {
    page,
    pageSize,
    totalMedia,
    totalPages: Math.ceil(totalMedia / pageSize),
    count: mediaList.length,
    data: mediaList
  };
}



// ========================================================
//  PESQUISAR MEDIA POR TÍTULO (INSENSITIVE)
// ========================================================
export async function searchMediaByTitleService(query) {

  const { title } = query;

  if (!title || title.trim() === "" || title === "undefined" || title === "null") {
    throw new Error("Title query parameter is required");
  }

  let { page = 1, pageSize = 10 } = query;

  page = Number(page);
  pageSize = Number(pageSize);
  const skip = (page - 1) * pageSize;

  const where = {
    title: {
      contains: title,
    }
  };

  const total = await prisma.media.count({ where });

  if (total === 0) {
    throw new Error(`Media not found ${title}`);
  }

  const media = await prisma.media.findMany({
    where,
    skip,
    take: pageSize,
    include: {
      user: { select: { id: true, nickName: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
    count: media.length,
    data: media
  };
}



// ========================================================
//  OBTER MEDIA POR ID
// ========================================================
export async function getMediaByIdService(id) {

  const media = await prisma.media.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, nickName: true } }
    }
  });

  if (!media) throw new Error("Media not found");

  return media;
}



// ========================================================
//  ATUALIZAR MEDIA
// ========================================================
export async function updateMediaService(id, body, user) {

  if (user.role !== "ADMIN") {
    throw new Error("Only admins can update media");
  }

  const result = mediaUpdateSchema.safeParse(body);
  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) throw new Error("Media not found");

  const updated = await prisma.media.update({
    where: { id },
    data: result.data
  });

  return updated;
}



// ========================================================
//  APAGAR MEDIA
// ========================================================
export async function deleteMediaService(id, user) {

  if (user.role !== "ADMIN") {
    throw new Error("Only admins can delete media");
  }

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) throw new Error("Media not found");

  await prisma.userMedia.deleteMany({ where: { mediaId: id } });
  await prisma.comment.deleteMany({ where: { mediaId: id } });

  await prisma.media.delete({ where: { id } });

  return {
    message: "Media deleted successfully",
    deletedMedia: {
      id: media.id,
      title: media.title,
      type: media.type
    },
    deletedBy: user.nickName
  };
}

