import { Router } from 'express';
import jobRoutes from './job/job.routes';
import resumeRoutes from './resume/resume.routes';
import sniperRoutes from './sniper/sniper.routes';
import channelRoutes from './channel/channel.routes';
import userRoutes from './user/user.routes';
import bundleRoutes from './bundle/bundle.routes';
import statsRoutes from './stats/stats.routes';

const router = Router();

router.use('/jobs', jobRoutes);
router.use('/resume', resumeRoutes);
router.use('/sniper', sniperRoutes);
router.use('/channels', channelRoutes);
router.use('/users', userRoutes);
router.use('/bundles', bundleRoutes);
router.use('/stats', statsRoutes); // Public stats endpoint

export default router;
