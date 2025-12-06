import { BundleRepository } from './bundle.repository';
import { BundleInfo } from './bundle.types';
import { Logger } from '@utils/logger';
import { NotFoundError } from '@utils/errors';

export class BundleService {
  private bundleRepository: BundleRepository;

  constructor() {
    this.bundleRepository = new BundleRepository();
  }

  async getAllBundles(): Promise<BundleInfo[]> {
    try {
      const bundles = await this.bundleRepository.findAll();

      return bundles.map((bundle) => ({
        id: bundle.id,
        title: bundle.title,
        description: bundle.description,
        icon: bundle.icon,
        channels: bundle.channels,
        order: bundle.order,
        category: bundle.category,
      }));
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
        channels: bundle.channels,
        order: bundle.order,
        category: bundle.category,
      };
    } catch (error) {
      Logger.error(`Failed to fetch bundle ${id}:`, error);
      throw error;
    }
  }
}
