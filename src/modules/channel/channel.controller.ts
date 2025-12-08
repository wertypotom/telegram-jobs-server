import { Request, Response, NextFunction } from 'express';
import { ChannelService } from './channel.service';
import { ApiResponse } from '@utils/response';
import { BadRequestError } from '@utils/errors';

export class ChannelController {
  private channelService: ChannelService;

  constructor() {
    this.channelService = new ChannelService();
  }

  /**
   * GET /api/channels/available
   * Get all channels the server is monitoring
   */
  getAvailableChannels = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const channels = await this.channelService.getAvailableChannels();
      ApiResponse.success(
        res,
        channels,
        'Available channels fetched successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/channels/user-channels
   * Get user's subscribed channels
   */
  getUserChannels = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const channels = await this.channelService.getUserChannels(userId);
      ApiResponse.success(res, channels, 'User channels fetched successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/channels/recommended
   * Get recommended job channels
   */
  getRecommendedChannels = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const channels = this.channelService.getRecommendedChannels();
      ApiResponse.success(
        res,
        channels,
        'Recommended channels fetched successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/channels/search
   * Search for Telegram channels
   */
  searchChannels = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const { query } = req.body;

      if (!query || query.trim().length === 0) {
        throw new BadRequestError('Search query is required');
      }

      const channels = await this.channelService.searchChannels(userId, query);
      ApiResponse.success(res, channels, 'Channels found successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/channels/subscribe
   * Subscribe user to selected channels (DB only - no Telegram join)
   */
  subscribeToChannels = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const { channels } = req.body;

      // Allow empty arrays - users can unsubscribe from all channels (Zero State)
      if (!channels || !Array.isArray(channels)) {
        throw new BadRequestError('Channels must be an array');
      }

      const result = await this.channelService.subscribeToChannels(
        userId,
        channels
      );
      ApiResponse.success(res, result, 'Successfully subscribed to channels');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/channels/add
   * Add new channels to existing subscriptions (DB only)
   */
  addChannels = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const { channels } = req.body;

      if (!channels || !Array.isArray(channels) || channels.length === 0) {
        throw new BadRequestError('At least one channel must be provided');
      }

      const result = await this.channelService.addChannels(userId, channels);
      ApiResponse.success(res, result, 'Successfully added new channels');
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/channels/explore
   * Explore channels with filters (Phase 2C Discovery)
   */
  exploreChannels = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const { searchQuery, categories } = req.query;

      const result = await this.channelService.exploreChannels(userId, {
        searchQuery: searchQuery as string | undefined,
        categories: categories ? (categories as string).split(',') : undefined,
      });

      ApiResponse.success(res, result, 'Channels explored successfully');
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/channels/unsubscribe
   * Unsubscribe from a single channel
   */
  unsubscribeChannel = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const { channel } = req.body;

      if (!channel) {
        throw new BadRequestError('Channel username is required');
      }

      const result = await this.channelService.unsubscribeChannel(
        userId,
        channel
      );

      ApiResponse.success(
        res,
        result,
        'Successfully unsubscribed from channel'
      );
    } catch (error) {
      next(error);
    }
  };
}
