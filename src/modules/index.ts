import { Router } from 'express';

import bundleRoutes from './bundle/bundle.routes';
import channelRoutes from './channel/channel.routes';
import feedbackRoutes from './feedback/feedback.routes';
import jobRoutes from './job/job.routes';
import notificationRoutes from './notification/notification.routes';
import paymentRoutes from './payment/payment.routes';
import resumeRoutes from './resume/resume.routes';
import marketInsightsRoutes from './seo-market-insights/market-insights.routes';
import sniperRoutes from './sniper/sniper.routes';
import statsRoutes from './stats/stats.routes';
import userRoutes from './user/user.routes';

const router = Router();

router.use('/jobs', jobRoutes);
router.use('/resume', resumeRoutes);
router.use('/sniper', sniperRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/channels', channelRoutes);
router.use('/users', userRoutes);
router.use('/bundles', bundleRoutes);
router.use('/stats', statsRoutes);
router.use('/notifications', notificationRoutes);
router.use('/payment', paymentRoutes);
router.use('/market-insights', marketInsightsRoutes);

export default router;
