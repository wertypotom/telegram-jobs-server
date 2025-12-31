import 'tsconfig-paths/register';
import 'dotenv/config';
import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { envConfig } from '@config/env.config';
import { errorHandler, notFoundHandler } from '@middlewares/error.middleware';
import routes from './modules';
import path from 'path';

const app: Application = express();

// Middleware
app.use(
  cors({
    origin: envConfig.frontendUrl,
    credentials: true,
  })
);
app.use(cookieParser());
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

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
