// Logger unused import removed

import { Bundle, IBundleDocument } from './bundle.model';

export class BundleRepository {
  async findAll(): Promise<IBundleDocument[]> {
    return Bundle.find({ isActive: true }).sort({ order: 1 }).exec();
  }

  async findById(id: string): Promise<IBundleDocument | null> {
    return Bundle.findOne({ id, isActive: true }).exec();
  }

  async create(data: Partial<IBundleDocument>): Promise<IBundleDocument> {
    const bundle = new Bundle(data);
    return bundle.save();
  }

  async update(id: string, data: Partial<IBundleDocument>): Promise<IBundleDocument | null> {
    return Bundle.findOneAndUpdate({ id }, data, { new: true }).exec();
  }

  async delete(id: string): Promise<void> {
    await Bundle.findOneAndUpdate({ id }, { isActive: false }).exec();
  }

  async count(): Promise<number> {
    return Bundle.countDocuments({ isActive: true }).exec();
  }
}
