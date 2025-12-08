import { Router } from 'express';
import { ChannelController } from './channel.controller';
import { authenticate } from '@middlewares/auth.middleware';

const router = Router();
const channelController = new ChannelController();

// Get all available channels (server is monitoring)
router.get('/available', authenticate, channelController.getAvailableChannels);

// Get user's subscribed channels
router.get('/user-channels', authenticate, channelController.getUserChannels);

// Get recommended channels
router.get('/recommended', channelController.getRecommendedChannels);

// Search channels
router.post('/search', authenticate, channelController.searchChannels);

// Subscribe to channels (DB only)
router.post('/subscribe', authenticate, channelController.subscribeToChannels);

// Add channels to subscription (DB only)
router.post('/add', authenticate, channelController.addChannels);
router.get('/explore', authenticate, channelController.exploreChannels);
router.post('/unsubscribe', authenticate, channelController.unsubscribeChannel);

export default router;
