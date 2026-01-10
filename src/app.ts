import 'tsconfig-paths/register';
import 'dotenv/config';

import { envConfig } from '@config/env.config';
import { errorHandler, notFoundHandler } from '@middlewares/error.middleware';
import * as Sentry from '@sentry/node';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application } from 'express';
import path from 'path';

import routes from './modules';

const app: Application = express();

// Sentry request handler must be the first middleware
app.use(Sentry.Handlers.requestHandler());

// Sentry tracing handler for performance monitoring
app.use(Sentry.Handlers.tracingHandler());

// Middleware
app.use(
  cors({
    origin: envConfig.frontendUrl,
    credentials: true,
  })
);
app.use(cookieParser());

// Webhook needs raw body for signature validation
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }), (req, _res, next) => {
  // Store raw body for signature verification
  (req as any).rawBody = req.body.toString('utf8');
  next();
});

// Parse JSON for all other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from temp directory
app.use('/temp', express.static(path.join(__dirname, '../public/temp')));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

// Routes
app.use('/api', routes);

// Sentry error handler must be before custom error handlers
app.use(Sentry.Handlers.errorHandler());

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
