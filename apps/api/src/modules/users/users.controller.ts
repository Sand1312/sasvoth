import {
  Controller,
  Get,
  UseGuards,
  Req,
  Post,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { UsersService } from './users.service';
import { Response } from 'express';

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
  @Post("connectWallet")
  @UseGuards(AuthGuard("jwt"))
  async connectWallet(@Req() req: Request, @Res() res: Response) {
      const userId = req.body();
      const walletAddress = req.body();
      try {
          const result = await this.usersService.connectWallet(userId, walletAddress);
          return res.status(200).json({ success: result });
      } catch (error) {
          return res.status(500).json({ message: 'Error connecting wallet', error });
      }


  }
}
