import { Channel } from '@modules/channel/channel.model';
import { NotFoundError } from '@utils/errors';
import { Logger } from '@utils/logger';

import { BundleRepository } from './bundle.repository';
import { BundleInfo } from './bundle.types';

export class BundleService {
  private bundleRepository: BundleRepository;

  constructor() {
    this.bundleRepository = new BundleRepository();
  }

  /**
   * Validate and repair bundle channels - replace missing channels with valid ones
   */
  private async validateBundleChannels(channels: string[], category: string): Promise<string[]> {
    const validChannels: string[] = [];

    for (const username of channels) {
      const exists = await Channel.findOne({ username, isMonitored: true });
      if (exists) {
        validChannels.push(username);
      }
    }

    // If some channels are missing, fill with other channels from same category
    if (validChannels.length < channels.length) {
      const needed = channels.length - validChannels.length;
      const replacements = await Channel.find({
        category,
        isMonitored: true,
        username: { $nin: validChannels },
      })
        .limit(needed)
        .select('username');

      for (const ch of replacements) {
        validChannels.push(ch.username);
      }

      if (replacements.length > 0) {
        Logger.info(
          `Bundle validation: replaced ${replacements.length} missing channels in category "${category}"`
        );
      }
    }

    return validChannels;
  }

  async getAllBundles(): Promise<BundleInfo[]> {
    try {
      const bundles = await this.bundleRepository.findAll();

      // Validate and repair channels dynamically
      const validatedBundles = await Promise.all(
        bundles.map(async (bundle) => ({
          id: bundle.id,
          title: bundle.title,
          description: bundle.description,
          icon: bundle.icon,
          channels: await this.validateBundleChannels(bundle.channels, bundle.category),
          order: bundle.order,
          category: bundle.category,
        }))
      );

      return validatedBundles;
    } catch (error) {
      Logger.error('Failed to fetch bundles:', error);
      throw error;
    }
  }

  async getBundleById(id: string): Promise<BundleInfo> {
    try {
      const bundle = await this.bundleRepository.findById(id);

      if (!bundle) {
        throw new NotFoundError(`Bundle with id "${id}" not found`);
      }

      return {
        id: bundle.id,
        title: bundle.title,
        description: bundle.description,
        icon: bundle.icon,
        channels: await this.validateBundleChannels(bundle.channels, bundle.category),
        order: bundle.order,
        category: bundle.category,
      };
    } catch (error) {
      Logger.error(`Failed to fetch bundle ${id}:`, error);
      throw error;
    }
  }
}
