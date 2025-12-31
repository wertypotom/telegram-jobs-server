import { authenticate } from '@middlewares/auth.middleware';
import { validate } from '@middlewares/validation.middleware';
import { Router } from 'express';

import { SniperController } from './sniper.controller';
import { tailorResumeSchema } from './sniper.validator';

const router = Router();
const sniperController = new SniperController();

router.post(
  '/generate',
  authenticate,
  validate(tailorResumeSchema),
  sniperController.generateTailoredResume
);

export default router;
