import { Router } from 'express';
import { AuthController } from './auth.controller';
import { TelegramAuthController } from './telegram-auth.controller';
import { validate } from '@middlewares/validation.middleware';
import { authenticate } from '@middlewares/auth.middleware';
import { registerSchema, loginSchema } from './auth.validator';

const router = Router();
const authController = new AuthController();
const telegramAuthController = new TelegramAuthController();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.getCurrentUser);

// Telegram authentication routes
router.post('/telegram/send-code', telegramAuthController.sendCode);
router.post('/telegram/verify-code', telegramAuthController.verifyCode);
router.post('/telegram/verify-password', telegramAuthController.verify2FAPassword);

export default router;
