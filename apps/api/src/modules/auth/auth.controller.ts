// src/modules/auth/auth.controller.ts
import { Controller, Get, Post, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google') // → http://localhost:8000/auth/google
  @UseGuards(AuthGuard('google')) // Passport handle redirect đến Google
  googleAuth(@Req() req: Request) {
    // Không cần body, Passport tự redirect
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    try {
    const profile = req.user as { googleId: string; email: string; name: string };
    if (!profile || !profile.email) {
      console.error('Google profile invalid:', profile); // DEBUG
      return res.status(400).send('Invalid Google profile');
    }
    const user = await this.authService.validateGoogleUser(profile);
    const tokens = await this.authService.generateTokens(user._id.toString());
    this.setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
    
    // FIX: Redirect về FE dashboard (hoặc signin nếu fail)
    return res.redirect('http://localhost:3000/dashboard');
  } catch (error) {
    console.error('Google callback error:', error); // DEBUG backend console
    return res.redirect('http://localhost:3000/signin?error=auth_failed');
  }
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  githubAuth() {}

  // @Get('github/callback')
  // @UseGuards(AuthGuard('github'))
  // async githubAuthRedirect(@Req() req: Request, @Res() res: Response) {
  //   const profile = req.user as { githubId: string; email: string; name: string };
  //   const user = await this.authService.validateGithubUser(profile);
  //   const tokens = await this.authService.generateTokens(user._id.toString());
  //   this.setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
  //   return res.redirect('http://localhost:3000/dashboard');
  // }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token in cookie');
    }
    const tokens = await this.authService.refreshToken(refreshToken);
    this.setTokenCookies(res, tokens.accessToken, tokens.refreshToken);
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

  // FIX LỖI: Thêm method private này vào class (bạn quên khai báo trong class)
  private setTokenCookies(res: Response, accessToken: string, refreshToken: string) {
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15m
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7d
    });
  }
}