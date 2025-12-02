import { Router } from 'express';
import jobRoutes from './job/job.routes';
import resumeRoutes from './resume/resume.routes';
import sniperRoutes from './sniper/sniper.routes';
import channelRoutes from './channel/channel.routes';

const router = Router();

router.use('/jobs', jobRoutes);
router.use('/resume', resumeRoutes);
router.use('/sniper', sniperRoutes);
router.use('/channels', channelRoutes);

export default router;
