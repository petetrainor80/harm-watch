import { z } from "zod";

export const registerOrgSchema = z.object({
  org_name: z.string().min(2).max(200),
  website: z.preprocess(
    (val) =>
      typeof val === "string" && !/^https?:\/\//i.test(val)
        ? `https://${val}`
        : val,
    z.string().url("Must be a valid website URL (e.g. https://example.org)")
  ),
  contact_name: z.string().min(2).max(200),
  work_email: z.string().email("Must be a valid email"),
  job_title: z.string().min(2).max(200),
  org_type: z.enum(["charity", "government", "isp", "legal", "other"]),
  registration_number: z.string().max(50).optional(),
  justification: z
    .string()
    .min(20, "Please provide at least 20 characters explaining why you need access")
    .max(2000),
  turnstile_token: z.string().min(1),
});

export type RegisterOrgInput = z.infer<typeof registerOrgSchema>;
