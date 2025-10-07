import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup/email')
  async signupWithEmail(
    @Body() body: { email: string; password: string; rePassword: string; walletAddress: string; signature?: string },
  ) {
    return this.authService.signupWithEmail(
      body.email,
      body.password,
      body.rePassword,
      body.walletAddress,
      body.signature,
    );
  }

  @Post('signin/email')
  async signinWithEmail(
    @Body() body: { email: string; password: string },
  ) {
    return this.authService.signinWithEmail(
      body.email,
      body.password
    );
  }
  @Post('signin/wallet')
  async signinWithWallet(
    @Body() body: { walletAddress: string; signature: string },
  ) {
    return this.authService.signinWithMetamask(
      body.walletAddress,
      body.signature
    );
  } 

  @UseGuards(AuthGuard('google'))
  @Post('signup/google')
  async signupWithGoogle(@Request() req, @Body() body: { walletAddress: string; signature?: string }) {
    return this.authService.signupWithGoogle(
      req.user.googleId,
      req.user.email,
      body.walletAddress,
      body.signature,
    );
  }

  @UseGuards(AuthGuard('google'))
  @Post('signin/google')
  async signinWithGoogle(@Request() req) {
    return this.authService.signinWithGoogle(
      req.user.googleId,
    );
  }

  @UseGuards(AuthGuard('github'))
  @Post('signup/github')
  async signupWithGithub(@Request() req, @Body() body: { walletAddress: string; signature?: string }) {
    return this.authService.signupWithGithub(
      req.user.githubId,
      req.user.email,
      body.walletAddress,
      body.signature
    );
  }

  @UseGuards(AuthGuard('github'))
  @Post('signin/github')
  async signinWithGithub(@Request() req) {
    return this.authService.signinWithGithub(
      req.user.githubId
    );
  }
}