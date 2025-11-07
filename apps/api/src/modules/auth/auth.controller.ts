// src/modules/auth/auth.controller.ts
import { Controller, Get, Post, Req, Res, UseGuards, UnauthorizedException,BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { ethers } from 'ethers';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('signin/google')
  @UseGuards(AuthGuard('google')) 
  googleAuth(@Req() req: Request) {
    // Không cần body, Passport tự redirect
  }

  @Get('signin/google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as { googleId: string; email: string; name: string };
    const user = await this.authService.validateGoogleUser(profile);
    const role = user.role;
    const tokens = await this.authService.generateTokens(user._id.toString()); 
    this.setTokenCookies(res,role, tokens.accessToken, tokens.refreshToken);
    return res.redirect('http://localhost:3000/dashboard');
  }

  @Get('signin/github')
  @UseGuards(AuthGuard('github'))
  githubAuth() {}

  @Get('signin/github/callback')
  @UseGuards(AuthGuard('github'))
  async githubAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as { githubId: string; email: string; name: string };
    const user = await this.authService.validateGithubUser(profile);
    const role = user.role;
    const tokens = await this.authService.generateTokens(user._id.toString());
    this.setTokenCookies(res, role, tokens.accessToken, tokens.refreshToken);
    return res.redirect('http://localhost:3000/dashboard');
  }

  @Post('signin/wallet')
  async walletAuth(@Req() req: Request, @Res() res: Response) {
    const { address, signature,message } = req.body;
    if (!address || !signature) {
      console.log('Address or signature missing:', { address, signature });
      throw new UnauthorizedException('Address and signature are required');
    }
    if (!ethers.utils.isAddress(address)) {
      console.log('Invalid wallet address:', address);
      throw new BadRequestException('Invalid wallet address');
    }
    if (signature) {
      const mess = 'Sign to login with MetaMask';
      const signerAddress = ethers.utils.verifyMessage(mess, signature);
      if (signerAddress.toLowerCase() !== address.toLowerCase()) {
        throw new BadRequestException('Invalid signature');
      }
    }
    const user = await this.authService.validateWalletUser(address, signature);
    const role = user.role;
    const tokens = await this.authService.generateTokens(user._id.toString());
    this.setTokenCookies(res,role, tokens.accessToken, tokens.refreshToken);
    console.log('Wallet authenticated:', address);
    return res.json({ message: 'Wallet authenticated successfully' ,user});
  }
  @Post('signin/email')
  async emailSignIn(@Req() req: Request, @Res() res: Response) {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new UnauthorizedException('Email and password are required');
    }
    const user = await this.authService.signInEmail(email, password);
    const role = user.role;
    const tokens = await this.authService.generateTokens(user._id.toString());
    this.setTokenCookies(res,role, tokens.accessToken, tokens.refreshToken);
    return res.json({ message: 'Email signed in successfully' });
  }
  @Post('signup/email')
  async emailSignUp(@Req() req: Request, @Res() res: Response) {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new UnauthorizedException('Email and password are required');
    }
    const user = await this.authService.signUpEmail(email, password);
    const role = user.role;
    const tokens = await this.authService.generateTokens(user._id.toString());
    this.setTokenCookies(res,role , tokens.accessToken, tokens.refreshToken);
    return res.json({ message: 'Email signed up successfully' });
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies.refresh_token;
    const role = req.cookies.role;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token in cookie');
    }
    const tokens = await this.authService.refreshToken(refreshToken);
    this.setTokenCookies(res,role, tokens.accessToken, tokens.refreshToken);
    return res.json({ message: 'Tokens refreshed successfully' });
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req: Request, @Res() res: Response) {
    const userId = (req.user as any).userId;
    await this.authService.logout(userId);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return res.json({ message: 'Logged out successfully' });
  }


  
  private setTokenCookies(res: Response, role:string, accessToken: string, refreshToken: string) {
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProd ,        
    sameSite: isProd ? 'strict' : 'none', // 'none' cho cross-domain
   
    path: '/',
    maxAge: 15 * 60 * 1000, // 15m
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProd ,
    sameSite: isProd ? 'strict' : 'none',
    
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
  });
  res.cookie('role', role, {
    httpOnly: false,
    secure: isProd ,
    sameSite: isProd ? 'strict' : 'none', 
  });
}

}