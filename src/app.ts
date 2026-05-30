import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { globalLimiter } from './middleware/rateLimit.js';
import adRoutes from './routes/ad.routes.js';
import adminRoutes from './routes/admin.routes.js';
import authRoutes from './routes/auth.routes.js';
import loyaltyRoutes from './routes/loyalty.routes.js';
import memberRoutes from './routes/member.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import offerRoutes from './routes/offer.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import pointsRoutes from './routes/points.routes.js';
import posRoutes from './routes/pos.routes.js';
import referralRoutes from './routes/referral.routes.js';
import shopRoutes from './routes/shop.routes.js';
import tierRoutes from './routes/tier.routes.js';
import checkinRoutes from './routes/checkin.routes.js';

export const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.cors.allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(globalLimiter);

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      service: 'loyyo-backend',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

const apiPrefix = '/api/v1';

app.use(`${apiPrefix}/auth`,          authRoutes);
app.use(`${apiPrefix}/shops`,         shopRoutes);
app.use(`${apiPrefix}/members`,       memberRoutes);
app.use(`${apiPrefix}/loyalty`,       loyaltyRoutes);
app.use(`${apiPrefix}/offers`,        offerRoutes);
app.use(`${apiPrefix}/ads`,           adRoutes);
app.use(`${apiPrefix}/payments`,      paymentRoutes);
app.use(`${apiPrefix}/pos`,           posRoutes);
app.use(`${apiPrefix}/referrals`,     referralRoutes);
app.use(`${apiPrefix}/notifications`, notificationRoutes);
app.use(`${apiPrefix}/points`,        pointsRoutes);
app.use(`${apiPrefix}/tier`,          tierRoutes);
app.use(`${apiPrefix}/admin`,         adminRoutes);
app.use(`${apiPrefix}/checkin`,       checkinRoutes);

app.use(notFound);
app.use(errorHandler);
