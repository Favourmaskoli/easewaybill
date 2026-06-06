// export const appConfig = () => ({
//   app: {
//     env: process.env.NODE_ENV ?? 'development',
//     port: parseInt(process.env.PORT ?? '3000', 10),
//     apiPrefix: process.env.API_PREFIX ?? 'api/v1',
//     isProduction: process.env.NODE_ENV === 'production',
//   },
//   database: {
//     url: process.env.DATABASE_URL,
//   },
//   jwt: {
//     secret: process.env.JWT_SECRET,
//     accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
//     refreshSecret: process.env.JWT_REFRESH_SECRET,
//     refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
//   },
//   throttle: {
//     ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
//     limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
//   },
//   cors: {
//     origins: (process.env.CORS_ORIGINS ?? '').split(',').map((o) => o.trim()),
//   },
//   paystack: {
//     secretKey: process.env.PAYSTACK_SECRET_KEY,
//     publicKey: process.env.PAYSTACK_PUBLIC_KEY,
//     webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET,
//   },
//   cloudinary: {
//     cloudName: process.env.CLOUDINARY_CLOUD_NAME,
//     apiKey: process.env.CLOUDINARY_API_KEY,
//     apiSecret: process.env.CLOUDINARY_API_SECRET,
//   },
//   smtp: {
//     host: process.env.SMTP_HOST,
//     port: parseInt(process.env.SMTP_PORT ?? '587', 10),
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//     from: process.env.SMTP_FROM ?? 'noreply@easewaybill.com',
//   },
// });

// export type AppConfig = ReturnType<typeof appConfig>;

export const appConfig = () => ({
  app: {
    env: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3000', 10),
    apiPrefix: process.env.API_PREFIX ?? 'api/v1',
    isProduction: process.env.NODE_ENV === 'production',
  },

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },

  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
  },

  cors: {
    origins: (process.env.CORS_ORIGINS ?? '').split(',').map((o) => o.trim()),
  },

  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY,
    publicKey: process.env.PAYSTACK_PUBLIC_KEY,
    webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET,
    baseUrl: process.env.PAYSTACK_BASE_URL ?? 'https://api.paystack.co',
    callbackUrl: process.env.PAYSTACK_CALLBACK_URL ?? 'http://localhost:3001/payment/callback',
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM ?? 'noreply@easewaybill.com',
  },
});

export type AppConfig = ReturnType<typeof appConfig>;
