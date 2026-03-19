import type { Env } from '@/lib/env'

export {}
declare global {
  namespace NodeJS {
    // Typed from the Zod schema in src/lib/env.ts — add vars there, not here
    interface ProcessEnv extends Env {}
  }
}
