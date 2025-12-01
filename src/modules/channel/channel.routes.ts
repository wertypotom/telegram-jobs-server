import { Router } from 'express';
import { ChannelController } from './channel.controller';
import { authenticate } from '@middlewares/auth.middleware';

const router = Router();
const channelController = new ChannelController();

// All routes require authentication
router.use(authenticate);

// Get user's Telegram channels
router.get('/user-channels', channelController.getUserChannels);

// Get recommended channels
router.get('/recommended', channelController.getRecommendedChannels);

// Search for channels
router.post('/search', channelController.searchChannels);

// Subscribe to channels
router.post('/subscribe', channelController.subscribeToChannels);

// Get user's subscribed channels
router.get('/subscribed', channelController.getSubscribedChannels);

// Add new channels to subscriptions
router.post('/add', channelController.addChannels);

export default router;
