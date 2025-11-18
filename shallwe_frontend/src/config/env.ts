/* eslint-disable @typescript-eslint/no-namespace, @typescript-eslint/no-empty-object-type */
import { z } from "zod"


const booleanStringSchema = z.string()
  .refine(
    (value) => value === "true" || value === "false",
    { message: "Must be exactly 'true' or 'false'" }
  )
  .transform((value) => value === "true")


const oAuthCliendIdStringSchema = z.string()
  .min(28)
  .refine(
    (value) => value.endsWith(".apps.googleusercontent.com"),
    { message: "Must be a valid Google OAuth client ID ending with .apps.googleusercontent.com" }
  )


// Env schema and minimal validation
const envSchema = z.object({
  NEXT_PUBLIC_SHALLWE_ENV_MODE: z.string(),
  NEXT_PUBLIC_SHALLWE_API_BASE_URL_EXTERNAL: z.url(),
  NEXT_PUBLIC_SHALLWE_API_BASE_URL_INTERNAL: z.url(),
  NEXT_PUBLIC_SHALLWE_OAUTH_REDIRECT_URI: z.url(),
  NEXT_PUBLIC_SHALLWE_OAUTH_CLIENT_ID: oAuthCliendIdStringSchema,
  NEXT_PUBLIC_SHALLWE_SKIP_MIDDLEWARE: booleanStringSchema,
  NEXT_PUBLIC_SHALLWE_MOCK_API: booleanStringSchema,
  NEXT_PUBLIC_SHALLWE_MIDDLEWARE_COOKIES_SECURE: booleanStringSchema
})


// Linking the exact keys (not ".parse(process.env)" because won't be linked in the browser)
export const env = envSchema.parse({
  NEXT_PUBLIC_SHALLWE_ENV_MODE: process.env.NEXT_PUBLIC_SHALLWE_ENV_MODE,
  NEXT_PUBLIC_SHALLWE_API_BASE_URL_EXTERNAL: process.env.NEXT_PUBLIC_SHALLWE_API_BASE_URL_EXTERNAL,
  NEXT_PUBLIC_SHALLWE_API_BASE_URL_INTERNAL: process.env.NEXT_PUBLIC_SHALLWE_API_BASE_URL_INTERNAL,
  NEXT_PUBLIC_SHALLWE_OAUTH_REDIRECT_URI: process.env.NEXT_PUBLIC_SHALLWE_OAUTH_REDIRECT_URI,
  NEXT_PUBLIC_SHALLWE_OAUTH_CLIENT_ID: process.env.NEXT_PUBLIC_SHALLWE_OAUTH_CLIENT_ID,
  NEXT_PUBLIC_SHALLWE_SKIP_MIDDLEWARE: process.env.NEXT_PUBLIC_SHALLWE_SKIP_MIDDLEWARE,
  NEXT_PUBLIC_SHALLWE_MOCK_API: process.env.NEXT_PUBLIC_SHALLWE_MOCK_API,
  NEXT_PUBLIC_SHALLWE_MIDDLEWARE_COOKIES_SECURE: process.env.NEXT_PUBLIC_SHALLWE_MIDDLEWARE_COOKIES_SECURE
})


// Declare expected vars for TS (not enforcing)
declare global {
  namespace NodeJS {
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}
