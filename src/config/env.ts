import dotenv from 'dotenv';
import Joi from 'joi';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production')
    .default('development'),
  PORT: Joi.number().default(5000),
  MONGODB_URI: Joi.string().required().description('MongoDB connection URI'),
  JWT_SECRET: Joi.string().required().description('JWT access token secret'),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().required().description('JWT refresh token secret'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
  BREVO_API_KEY: Joi.string().required().description('Brevo Sendinblue API key'),
  BREVO_SENDER_EMAIL: Joi.string().email().required(),
  BREVO_SENDER_NAME: Joi.string().default('LOYYO'),
  PAYHERE_MERCHANT_ID: Joi.string().required(),
  PAYHERE_SECRET: Joi.string().required(),
  PAYHERE_WEBHOOK_SECRET: Joi.string().required(),
  ALLOWED_ORIGINS: Joi.string().required().description('Comma-separated allowed CORS origins'),
  CLOUDINARY_CLOUD_NAME: Joi.string().required(),
  CLOUDINARY_API_KEY: Joi.string().required(),
  CLOUDINARY_API_SECRET: Joi.string().required(),
  HUGGING_FACE_API_KEY: Joi.string().required(),
}).unknown(true);

const { value: envVars, error } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const env = {
  env: envVars.NODE_ENV as 'development' | 'staging' | 'production',
  port: envVars.PORT as number,
  mongodbUri: envVars.MONGODB_URI as string,
  jwt: {
    secret: envVars.JWT_SECRET as string,
    expiresIn: envVars.JWT_EXPIRES_IN as string,
    refreshSecret: envVars.JWT_REFRESH_SECRET as string,
    refreshExpiresIn: envVars.JWT_REFRESH_EXPIRES_IN as string,
  },
  brevo: {
    apiKey: envVars.BREVO_API_KEY as string,
    senderEmail: envVars.BREVO_SENDER_EMAIL as string,
    senderName: envVars.BREVO_SENDER_NAME as string,
  },
  payhere: {
    merchantId: envVars.PAYHERE_MERCHANT_ID as string,
    secret: envVars.PAYHERE_SECRET as string,
    webhookSecret: envVars.PAYHERE_WEBHOOK_SECRET as string,
  },
  cors: {
    allowedOrigins: envVars.ALLOWED_ORIGINS.split(',').map((o: string) => o.trim()) as string[],
  },
  cloudinary: {
    cloudName: envVars.CLOUDINARY_CLOUD_NAME as string,
    apiKey: envVars.CLOUDINARY_API_KEY as string,
    apiSecret: envVars.CLOUDINARY_API_SECRET as string,
  },
  huggingFace: {
    apiKey: envVars.HUGGING_FACE_API_KEY as string,
  },
};
