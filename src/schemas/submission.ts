import { z } from "zod";

export const geolocationSchema = z.object({
  placeId: z.string().min(1, "Place ID is required"),
  formattedAddress: z.string().min(1, "Address is required"),
  lat: z.number().finite("Latitude must be a number"),
  lng: z.number().finite("Longitude must be a number"),
});

export const createSubmissionSchema = z.object({
  wallet: z.string().min(1, "Wallet address is required"),
  title: z
    .string()
    .min(10, "Title must be at least 10 characters")
    .max(100, "Title must be less than 100 characters"),
  link: z.string().url("Please enter a valid URL"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(500, "Description must be less than 500 characters"),
  geolocation: geolocationSchema,
  tipJarLimit: z
    .number()
    .positive("Tip jar limit must be positive")
    .optional()
    .default(100),
});

export const submissionResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  link: z.string(),
  description: z.string(),
  currentTips: z.number(),
  tipJarLimit: z.number(),
  user: z.object({
    wallet: z.string(),
  }),
  userWallet: z.string().optional(),
  geolocation: geolocationSchema.optional(),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type SubmissionResponse = z.infer<typeof submissionResponseSchema>;
