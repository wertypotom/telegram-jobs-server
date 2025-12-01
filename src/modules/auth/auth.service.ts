import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '@modules/user/user.repository';
import { RegisterDto, LoginDto, AuthResponse } from './auth.types';
import { BadRequestError, UnauthorizedError } from '@utils/errors';
import { envConfig } from '@config/env.config';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async register(data: RegisterDto): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new BadRequestError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await this.userRepository.create({
      email: data.email,
      password: hashedPassword,
      subscribedChannels: [],
    });

    // Generate token
    const token = this.generateToken(user._id.toString(), user.email);

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
      },
    };
  }

  async login(data: LoginDto): Promise<AuthResponse> {
    // Find user
    const user = await this.userRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate token
    const token = this.generateToken(user._id.toString(), user.email);

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
      },
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return {
      id: user._id.toString(),
      email: user.email,
      telegramPhone: user.telegramPhone,
      telegramUserId: user.telegramUserId,
      hasCompletedOnboarding: user.hasCompletedOnboarding,
    };
  }

  private generateToken(userId: string, email: string): string {
    const payload = { userId, email };
    const secret: jwt.Secret = envConfig.jwtSecret;
    const options: jwt.SignOptions = { 
      expiresIn: envConfig.jwtExpiresIn as jwt.SignOptions['expiresIn']
    };
    
    return jwt.sign(payload, secret, options);
  }
}
