import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { TelegramAuthService } from './telegram-auth.service';
import { UserRepository } from '@modules/user/user.repository';
import { SendCodeRequest, VerifyCodeRequest } from './telegram-auth.types';
import { ApiResponse } from '@utils/response';
import { BadRequestError } from '@utils/errors';
import { envConfig } from '@config/env.config';

export class TelegramAuthController {
  private telegramAuthService: TelegramAuthService;
  private userRepository: UserRepository;

  constructor() {
    this.telegramAuthService = new TelegramAuthService();
    this.userRepository = new UserRepository();
  }

  sendCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { phoneNumber }: SendCodeRequest = req.body;

      if (!phoneNumber) {
        throw new BadRequestError('Phone number is required');
      }

      const result = await this.telegramAuthService.sendCode(phoneNumber);

      ApiResponse.success(
        res,
        { phoneCodeHash: result.phoneCodeHash },
        'Verification code sent to Telegram'
      );
    } catch (error) {
      next(error);
    }
  };

  verifyCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { phoneNumber, code }: VerifyCodeRequest = req.body;

      if (!phoneNumber || !code) {
        throw new BadRequestError('Phone number and code are required');
      }

      // Verify code and get session or 2FA requirement
      const result = await this.telegramAuthService.verifyCode(
        phoneNumber,
        code
      );

      // Check if 2FA is required
      if ('requires2FA' in result) {
        ApiResponse.success(
          res,
          { requires2FA: true },
          '2FA password required'
        );
        return;
      }

      const { sessionString, telegramUserId } = result;

      // Find or create user
      let user = await this.userRepository.findOne({ telegramPhone: phoneNumber });

      if (!user) {
        // Create new user with Telegram auth
        user = await this.userRepository.create({
          email: `telegram_${telegramUserId}@temp.com`, // Temporary email
          password: Math.random().toString(36), // Random password (not used)
          telegramPhone: phoneNumber,
          telegramSession: sessionString,
          telegramUserId,
          subscribedChannels: [],
        });
      } else {
        // Update existing user's session
        const updatedUser = await this.userRepository.update(user._id.toString(), {
          telegramSession: sessionString,
          telegramUserId,
        });
        if (!updatedUser) {
          throw new BadRequestError('Failed to update user session');
        }
        user = updatedUser;
      }

      // Generate JWT token
      const token = this.generateToken(user._id.toString(), user.email);

      ApiResponse.success(
        res,
        {
          token,
          user: {
            id: user._id.toString(),
            email: user.email,
            telegramPhone: user.telegramPhone || phoneNumber,
          },
        },
        'Authentication successful'
      );
    } catch (error) {
      next(error);
    }
  };

  verify2FAPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { phoneNumber, password } = req.body;

      if (!phoneNumber || !password) {
        throw new BadRequestError('Phone number and password are required');
      }

      // Verify 2FA password
      const { sessionString, telegramUserId } = await this.telegramAuthService.verify2FAPassword(
        phoneNumber,
        password
      );

      // Find or create user
      let user = await this.userRepository.findOne({ telegramPhone: phoneNumber });

      if (!user) {
        // Create new user with Telegram auth
        user = await this.userRepository.create({
          email: `telegram_${telegramUserId}@temp.com`,
          password: Math.random().toString(36),
          telegramPhone: phoneNumber,
          telegramSession: sessionString,
          telegramUserId,
          subscribedChannels: [],
        });
      } else {
        // Update existing user's session
        const updatedUser = await this.userRepository.update(user._id.toString(), {
          telegramSession: sessionString,
          telegramUserId,
        });
        if (!updatedUser) {
          throw new BadRequestError('Failed to update user session');
        }
        user = updatedUser;
      }

      // Generate JWT token
      const token = this.generateToken(user._id.toString(), user.email);

      ApiResponse.success(
        res,
        {
          token,
          user: {
            id: user._id.toString(),
            email: user.email,
            telegramPhone: user.telegramPhone || phoneNumber,
          },
        },
        'Authentication successful'
      );
    } catch (error) {
      next(error);
    }
  };

  private generateToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email },
      envConfig.jwtSecret,
      { expiresIn: envConfig.jwtExpiresIn as jwt.SignOptions['expiresIn'] }
    );
  }
}
