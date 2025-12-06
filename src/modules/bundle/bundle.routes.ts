import { Router } from 'express';
import { BundleController } from './bundle.controller';

const router = Router();
const bundleController = new BundleController();

// Public routes
router.get('/', bundleController.getAllBundles);
router.get('/:id', bundleController.getBundleById);

export default router;
