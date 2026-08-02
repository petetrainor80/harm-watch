import { z } from "zod";

export const registerOrgSchema = z.object({
  org_name: z.string().min(2).max(200),
  website: z.string().url("Must be a valid URL"),
  contact_name: z.string().min(2).max(200),
  work_email: z.string().email("Must be a valid email"),
  job_title: z.string().min(2).max(200),
  org_type: z.enum(["charity", "government", "isp", "legal", "other"]),
  registration_number: z.string().max(50).optional(),
  justification: z
    .string()
    .min(50, "Please provide at least 50 characters explaining why you need access")
    .max(2000),
  turnstile_token: z.string().min(1),
});

export type RegisterOrgInput = z.infer<typeof registerOrgSchema>;
