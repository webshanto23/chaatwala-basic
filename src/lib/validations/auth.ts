import { z } from "zod";

export const customerSignInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const staffSignInSchema = z.object({
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,32}$/, "Invalid username"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Compatibility export for customer credentials callers while the staff
// workspace is introduced.
export const signInSchema = customerSignInSchema;

export const signUpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
