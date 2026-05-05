import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

// override: true garante que o .env sobrescreve qualquer variável já definida no sistema
loadEnv({ override: true });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().optional(),
  BACKEND_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET deve ter ao menos 16 caracteres'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(16, 'REFRESH_TOKEN_SECRET deve ter ao menos 16 caracteres'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  APP_URL: z.string().url().optional().default('http://localhost:3000'),
  ADMIN_EMAIL: z
    .string()
    .email()
    .optional()
    .or(z.literal('').transform(() => undefined)),
  ADMIN_PASSWORD: z
    .string()
    .min(6)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
});

const env = envSchema.parse(process.env);

export default env;

