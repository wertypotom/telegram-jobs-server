import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.types';
import { ApiResponse } from '@utils/response';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: RegisterDto = req.body;
      const result = await this.authService.register(data);
      ApiResponse.success(res, result, 'User registered successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const data: LoginDto = req.body;
      const result = await this.authService.login(data);
      ApiResponse.success(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  };

  getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as any).userId;
      const result = await this.authService.getCurrentUser(userId);
      ApiResponse.success(res, result, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}
