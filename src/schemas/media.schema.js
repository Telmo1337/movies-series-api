import { z } from "zod";

// Criar media
export const mediaSchema = z.object({
  title: z.string().min(1, "Title is required"),
  type: z.enum(["MOVIE", "SERIES"]),
  category: z.array(z.string()).min(1, "Category is required"),

  releaseYear: z.coerce.number()
    .min(1900)
    .max(new Date().getFullYear()),

  endYear: z.coerce.number()
    .min(1900)
    .max(new Date().getFullYear())
    .optional(),

  country: z.string().optional(),
  language: z.string().optional(),
  director: z.string().optional(),

  platform: z.array(z.string()).optional(),    // JSON ARRAY

  rating: z.coerce.number()
    .min(0)
    .max(10)
    .optional(),

  description: z.string().optional(),
  image: z.string().url("Invalid image URL").optional(),
});


// Atualizar media
export const mediaUpdateSchema = z.object({
  title: z.string().optional(),
  type: z.enum(["MOVIE", "SERIES"]).optional(),

  category: z.array(z.string()).optional(),

  releaseYear: z.coerce.number()
    .min(1900)
    .max(new Date().getFullYear())
    .optional(),

  endYear: z.coerce.number()
    .min(1900)
    .max(new Date().getFullYear())
    .optional(),

  country: z.string().optional(),
  language: z.string().optional(),
  director: z.string().optional(),

  platform: z.array(z.string()).optional(),

  rating: z.coerce.number()
    .min(0)
    .max(10)
    .optional(),

  description: z.string().optional(),
  image: z.string().url("Invalid image URL").optional(),
});


// Criar comentário
export const commentSchema = z.object({
  content: z.string().min(1, "Content is required"),
});
