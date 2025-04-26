import { z } from "zod";

export const createTipSchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
  userWallet: z.string().min(1, "User wallet is required"),
  amount: z.number().positive("Amount must be positive"),
  currency: z.enum(["SOL", "USD"]),
  transactionSignature: z.string().min(1, "Transaction signature is required"),
});

export const tipResponseSchema = z.object({
  id: z.string(),
  submissionId: z.string(),
  userId: z.string(),
  amount: z.number(),
  currency: z.string(),
  transactionSignature: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const tipQuerySchema = z.object({
  submissionId: z.string().min(1, "Submission ID is required"),
});

export type CreateTipInput = z.infer<typeof createTipSchema>;
export type TipResponse = z.infer<typeof tipResponseSchema>;
export type TipQueryParams = z.infer<typeof tipQuerySchema>;
