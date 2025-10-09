import { z } from "zod"


// Schema and minimal validation
const rawSchema = z.object({
  NEXT_PUBLIC_SHALLWE_API_BASE_URL_EXTERNAL: z.url(),
  NEXT_PUBLIC_SHALLWE_API_BASE_URL_INTERNAL: z.url(),
  NEXT_PUBLIC_SHALLWE_OAUTH_REDIRECT_URI: z.url(),
  NEXT_PUBLIC_SHALLWE_OAUTH_CLIENT_ID: z.string()
    .min(28)
    .refine(
      (value) => value.endsWith(".apps.googleusercontent.com"),
      { message: "Must be a valid Google OAuth client ID ending with .apps.googleusercontent.com" }
    ),
  NEXT_PUBLIC_SHALLWE_SKIP_MIDDLEWARE: z.string()
    .refine(
      (value) => value === "true" || value === "false",
      { message: "Must be exactly 'true' or 'false'" }
    ),
})


// Linking the exact keys (not ".parse(process.env)" because won't be linked in the browser)
export const env = rawSchema.parse({
  NEXT_PUBLIC_SHALLWE_API_BASE_URL_EXTERNAL: process.env.NEXT_PUBLIC_SHALLWE_API_BASE_URL_EXTERNAL,
  NEXT_PUBLIC_SHALLWE_API_BASE_URL_INTERNAL: process.env.NEXT_PUBLIC_SHALLWE_API_BASE_URL_INTERNAL,
  NEXT_PUBLIC_SHALLWE_OAUTH_REDIRECT_URI: process.env.NEXT_PUBLIC_SHALLWE_OAUTH_REDIRECT_URI,
  NEXT_PUBLIC_SHALLWE_OAUTH_CLIENT_ID: process.env.NEXT_PUBLIC_SHALLWE_OAUTH_CLIENT_ID,
  NEXT_PUBLIC_SHALLWE_SKIP_MIDDLEWARE: process.env.NEXT_PUBLIC_SHALLWE_SKIP_MIDDLEWARE,
})


// Declare expected vars for TS (not enforcing)
declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof rawSchema> {}
  }
}
