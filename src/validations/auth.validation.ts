import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});
