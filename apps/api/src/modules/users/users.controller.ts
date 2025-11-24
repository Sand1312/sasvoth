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
  // @UseGuards(AuthGuard("jwt"))
  async connectWallet(@Req() req: Request, @Res() res: Response) {
      const userId = req.body.userId;
      const walletAddress = req.body.walletAddress;
      try {
          const result = await this.usersService.connectWallet(userId, walletAddress);
          console.log('Connect Wallet Result:', result);
          if (result ===true){
              return res.status(200).json({ message: 'Wallet already connected' });
          }
          return res.status(201).json({ success: result });
      } catch (error) {
          return res.status(500).json({ message: 'Error connecting wallet', error });
      }
  }

  @Get("get")
  async getUser(@Req() req: Request, @Res() res: Response) {
      const userId = req.query.userId as string;
      try {
          const user = await this.usersService.findById(userId);
          if (!user) {
              return res.status(404).json({ message: 'User not found' });
          }
          return res.status(200).json({ user });
      } catch (error) {
          return res.status(500).json({ message: 'Error retrieving user', error });
      }
    }
    @Get("historyDeposit")
    async getHistoryDeposit(@Req() req: Request, @Res() res: Response) {
        const userId = req.query.userId as string;
        try {
            const history = await this.usersService.getHistoryDeposit(userId);
            return res.status(200).json({ history });
        } catch (error) {
            return res.status(500).json({ message: 'Error retrieving deposit history', error });
        }
    }

    @Post("deposit")
    async deposit(@Req() req:Request,@Res() res: Response){
      const {userId,amountToken,txHash} = req.body;
      try{
         const user = await this.usersService.updateBalance(userId,amountToken,txHash);
         return res.status(200).json({user})
      } catch(error){
        return res.status(500).json({message:'Error deposit',error})
      }
    }
}
