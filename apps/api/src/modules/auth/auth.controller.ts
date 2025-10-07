import { Controller, Post, Body, UseGuards, Request, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup/email')
  async signupWithEmail(
    @Body() body: { email: string; password: string; rePassword: string; walletAddress: string; signature?: string },
    @Res() res: Response,
  ) {
    const tokens = await this.authService.signupWithEmail(
      body.email,
      body.password,
      body.rePassword,
      body.walletAddress,
      body.signature,
    );
    this.setTokenCookies(res, tokens);
    return res.json({ message: 'Signup successful' });
  }

  @Post('signin/email')
  async signinWithEmail(
    @Body() body: { email: string; password: string },
    @Res() res: Response,
  ) {
    const tokens = await this.authService.signinWithEmail(body.email, body.password);
    this.setTokenCookies(res, tokens);
    return res.json({ message: 'Login successful' });
  }

  @Post('signin/wallet')
  async signinWithWallet(
    @Body() body: { walletAddress: string; signature: string },
    @Res() res: Response,
  ) {
    const tokens = await this.authService.signinWithMetamask(body.walletAddress, body.signature);
    this.setTokenCookies(res, tokens);
    return res.json({ message: 'Login with wallet successful' });
  }

  @UseGuards(AuthGuard('google'))
  @Post('signup/google')
  async signupWithGoogle(
    @Request() req,
    @Body() body: { walletAddress: string; signature?: string },
    @Res() res: Response,
  ) {
    const tokens = await this.authService.signupWithGoogle(
      req.user.googleId,
      req.user.email,
      body.walletAddress,
      body.signature,
    );
    this.setTokenCookies(res, tokens);
    return res.json({ message: 'Signup with Google successful' });
  }

  @UseGuards(AuthGuard('google'))
  @Post('signin/google')
  async signinWithGoogle(@Request() req, @Res() res: Response) {
    const tokens = await this.authService.signinWithGoogle(req.user.googleId);
    this.setTokenCookies(res, tokens);
    return res.json({ message: 'Login with Google successful' });
  }

  @UseGuards(AuthGuard('github'))
  @Post('signup/github')
  async signupWithGithub(
    @Request() req,
    @Body() body: { walletAddress: string; signature?: string },
    @Res() res: Response,
  ) {
    const tokens = await this.authService.signupWithGithub(
      req.user.githubId,
      req.user.email,
      body.walletAddress,
      body.signature,
    );
    this.setTokenCookies(res, tokens);
    return res.json({ message: 'Signup with Github successful' });
  }

  @UseGuards(AuthGuard('github'))
  @Post('signin/github')
  async signinWithGithub(@Request() req, @Res() res: Response) {
    const tokens = await this.authService.signinWithGithub(req.user.githubId);
    this.setTokenCookies(res, tokens);
    return res.json({ message: 'Login with Github successful' });
  }

  @Post('refresh')
  async refreshAccessToken(@Body() body: { refreshToken: string }, @Res() res: Response) {
    const tokens = await this.authService.refreshAccessToken(body.refreshToken);
    this.setTokenCookies(res, tokens);
    return res.json({ message: 'Token refreshed successfully' });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  async logout(@Request() req, @Res() res: Response) {
    await this.authService.logout(req.user._id);
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return res.json({ message: 'Logged out successfully' });
  }

  private setTokenCookies(res: Response, tokens: { access_token: string; refresh_token: string }) {
    res.cookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }
}