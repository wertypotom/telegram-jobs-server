import { User, IUserDocument } from '@modules/user/user.model';
import { IUser } from '@shared/types/common.types';

export class UserRepository {
  async create(userData: Partial<IUser>): Promise<IUserDocument> {
    const user = new User(userData);
    return await user.save();
  }

  async findByEmail(email: string): Promise<IUserDocument | null> {
    return await User.findOne({ email });
  }

  async findById(id: string): Promise<IUserDocument | null> {
    return await User.findById(id);
  }

  async updateById(id: string, data: Partial<IUser>): Promise<IUserDocument | null> {
    return await User.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteById(id: string): Promise<IUserDocument | null> {
    return await User.findByIdAndDelete(id);
  }

  async findAll(): Promise<IUserDocument[]> {
    return await User.find();
  }

  async findOne(filter: Partial<IUser>): Promise<IUserDocument | null> {
    return await User.findOne(filter);
  }

  async update(id: string, data: Partial<IUser>): Promise<IUserDocument | null> {
    return await User.findByIdAndUpdate(id, data, { new: true });
  }
}
