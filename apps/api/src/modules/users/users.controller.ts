import {
  Controller,
  Get,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@Req() req: Request) {
    const userId = (req.user as any)?.userId;
    if (!userId) {
      throw new NotFoundException('User not found');
    }
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // sanitize output (exclude sensitive fields like password, refresh state)
    return {
      id: user._id,
      email: (user as any).email,
      name: (user as any).name,
      role: (user as any).role,
      walletAddress: (user as any).walletAddress,
      authType: (user as any).authType,
    };
  }
}
