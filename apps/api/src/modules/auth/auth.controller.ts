// src/modules/auth/auth.controller.ts
import {
  Controller,
  Get,
  Post,
  Delete,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { ethers } from 'ethers';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';

/**
 * Auth Controller - RESTful Resource-Oriented
 *
 * Resource: /auth/sessions (authentication sessions)
 * Resource: /auth/users (user registration)
 *
 * POST   /auth/sessions          - Create session (login)
 * DELETE /auth/sessions          - Delete session (logout)
 * POST   /auth/users             - Create user (signup)
 * POST   /auth/sessions/validate - Validate current session
 * POST   /auth/sessions/refresh  - Refresh session tokens
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ========================================
  // RESTful Endpoints (New)
  // ========================================

  /**
   * Create a new authentication session (login)
   * POST /auth/sessions
   */
  @Post('sessions')
  @ApiOperation({ summary: 'Create authentication session (login)' })
  @ApiQuery({
    name: 'provider',
    required: false,
    description: 'OAuth provider (google, github)',
  })
  @ApiBody({ description: 'Credentials for email/wallet login' })
  @ApiResponse({ status: 200, description: 'Session created successfully' })
  async createSession(@Req() req: Request, @Res() res: Response) {
    const provider = (req.query.provider || req.body.provider) as string;

    switch (provider) {
      case 'google':
        return this.googleAuth(req, res);
      case 'github':
        return this.githubAuth(req, res);
      case 'wallet':
        return this.walletAuth(req, res);
      case 'email':
        return this.emailSignIn(req, res);
      default:
        throw new BadRequestException('Unsupported authentication provider');
    }
  }

  /**
   * Get session (OAuth callback)
   * GET /auth/sessions
   */
  @Get('sessions')
  @ApiOperation({ summary: 'OAuth redirect (for Google/GitHub)' })
  @ApiQuery({ name: 'provider', required: true })
  async getSession(@Req() req: Request, @Res() res: Response) {
    const provider = req.query.provider as string;

    switch (provider) {
      case 'google':
        return this.googleAuth(req, res);
      case 'github':
        return this.githubAuth(req, res);
      default:
        throw new BadRequestException('Unsupported OAuth provider');
    }
  }

  /**
   * OAuth callback
   * GET /auth/sessions/callback
   */
  @Get('sessions/callback')
  @ApiOperation({ summary: 'OAuth callback handler' })
  async sessionCallback(@Req() req: Request, @Res() res: Response) {
    const provider = req.query.provider as string;

    switch (provider) {
      case 'google':
        return this.googleCallback(req, res);
      case 'github':
        return this.githubCallback(req, res);
      default:
        throw new BadRequestException('Unsupported OAuth callback');
    }
  }

  /**
   * Delete current session (logout)
   * DELETE /auth/sessions
   */
  @Delete('sessions')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Delete authentication session (logout)' })
  @ApiResponse({ status: 200, description: 'Session deleted successfully' })
  async deleteSession(@Req() req: Request, @Res() res: Response) {
    const userId = (req.user as any).userId;
    await this.authService.logout(userId);

    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.clearCookie('role');

    return res.json({ message: 'Session deleted successfully' });
  }

  /**
   * Validate current session
   * POST /auth/sessions/validate
   */
  @Post('sessions/validate')
  @ApiOperation({ summary: 'Validate current session' })
  @ApiResponse({ status: 200, description: 'Session is valid' })
  @ApiResponse({ status: 401, description: 'Session is invalid' })
  async validateSession(@Req() req: Request, @Res() res: Response) {
    try {
      const token = req.cookies.access_token;
      if (!token) {
        return res.status(401).json({ message: 'No access token' });
      }

      const user = await this.authService.verifyAccessToken(token);
      if (!user) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }

      return res.status(200).json({ message: 'Session valid', user });
    } catch (err) {
      console.error('Session validation error:', err);
      return res.status(401).json({ message: 'Unauthorized' });
    }
  }

  /**
   * Refresh session tokens
   * POST /auth/sessions/refresh
   */
  @Post('sessions/refresh')
  @ApiOperation({ summary: 'Refresh session tokens' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  async refreshSession(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies.refresh_token;
    const role = req.cookies.role;
    if (!refreshToken)
      throw new UnauthorizedException('No refresh token in cookie');

    const tokens = await this.authService.refreshToken(refreshToken);
    this.setTokenCookies(res, role, tokens.accessToken, tokens.refreshToken);

    return res.json({
      message: 'Tokens refreshed successfully',
      tokens,
    });
  }

  /**
   * Create a new user (signup)
   * POST /auth/users
   */
  @Post('users')
  @ApiOperation({ summary: 'Create new user account (signup)' })
  @ApiBody({ description: 'User registration data' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async createUser(@Req() req: Request, @Res() res: Response) {
    const { email, password, name, walletAddress } = req.body;
    if (!email || !password)
      throw new UnauthorizedException('Email and password are required');

    const user = await this.authService.signUpEmail(email, password);
    const role = user.role;
    const tokens = await this.authService.generateTokens(user._id.toString());

    this.setTokenCookies(res, role, tokens.accessToken, tokens.refreshToken);

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role,
      },
      tokens,
    });
  }

  // ========================================
  // Legacy Endpoints (Backward Compatibility)
  // ========================================

  /** @deprecated Use POST /auth/sessions/validate instead */
  @Post('validate')
  async validate(@Req() req: Request, @Res() res: Response) {
    return this.validateSession(req, res);
  }

  /** @deprecated Use GET /auth/sessions?provider=X instead */
  @Get('signin')
  async signin(@Req() req: Request, @Res() res: Response) {
    const type = req.query.type as string;

    switch (type) {
      case 'google':
        return this.googleAuth(req, res);
      case 'github':
        return this.githubAuth(req, res);
      default:
        throw new BadRequestException('Unsupported signin type');
    }
  }

  /** @deprecated Use GET /auth/sessions/callback instead */
  @Get('signin/callback')
  async signinCallback(@Req() req: Request, @Res() res: Response) {
    const type = req.query.type as string;

    switch (type) {
      case 'google':
        return this.googleCallback(req, res);
      case 'github':
        return this.githubCallback(req, res);
      default:
        throw new BadRequestException('Unsupported signin callback type');
    }
  }

  /** @deprecated Use POST /auth/sessions instead */
  @Post('signin')
  async signinPost(@Req() req: Request, @Res() res: Response) {
    const type = req.query.type as string;

    switch (type) {
      case 'wallet':
        return this.walletAuth(req, res);
      case 'email':
        return this.emailSignIn(req, res);
      default:
        throw new BadRequestException('Unsupported signin type');
    }
  }

  // ---- GOOGLE ----
  @UseGuards(AuthGuard('google'))
  private async googleAuth(@Req() req: Request, @Res() res: Response) {
    // Passport tự redirect sang Google
  }

  @UseGuards(AuthGuard('google'))
  private async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as {
      googleId: string;
      email: string;
      name: string;
    };

    const user = await this.authService.validateGoogleUser(profile);
    const role = user.role;
    const tokens = await this.authService.generateTokens(user._id.toString());

    this.setTokenCookies(res, role, tokens.accessToken, tokens.refreshToken);

    return res.json({
      message: 'Google sign-in successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role,
      },
      tokens,
    });
  }

  // ---- GITHUB ----
  @UseGuards(AuthGuard('github'))
  private async githubAuth(@Req() req: Request, @Res() res: Response) {}

  @UseGuards(AuthGuard('github'))
  private async githubCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as {
      githubId: string;
      email: string;
      name: string;
    };

    const user = await this.authService.validateGithubUser(profile);
    const role = user.role;
    const tokens = await this.authService.generateTokens(user._id.toString());

    this.setTokenCookies(res, role, tokens.accessToken, tokens.refreshToken);

    return res.json({
      message: 'GitHub sign-in successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role,
      },
      tokens,
    });
  }

  // ---- WALLET ----
  private async walletAuth(@Req() req: Request, @Res() res: Response) {
    const { address, signature } = req.body;

    if (!address || !signature)
      throw new UnauthorizedException('Address and signature are required');

    if (!ethers.utils.isAddress(address))
      throw new BadRequestException('Invalid wallet address');

    const msg = 'Sign to login with MetaMask';
    const signer = ethers.utils.verifyMessage(msg, signature);
    if (signer.toLowerCase() !== address.toLowerCase())
      throw new BadRequestException('Invalid signature');

    const user = await this.authService.validateWalletUser(address, signature);
    const role = user.role;
    const tokens = await this.authService.generateTokens(user.id.toString());

    this.setTokenCookies(res, role, tokens.accessToken, tokens.refreshToken);

    // console.log("Wallet authenticated successfully for user:", user);
    return res.json({
      message: 'Wallet authenticated successfully',
      user: user,
      tokens,
    });
  }

  // ---- EMAIL ----
  private async emailSignIn(@Req() req: Request, @Res() res: Response) {
    const { email, password } = req.body;
    if (!email || !password)
      throw new UnauthorizedException('Email and password are required');

    const user = await this.authService.signInEmail(email, password);
    const role = user.role;
    const tokens = await this.authService.generateTokens(user._id.toString());

    this.setTokenCookies(res, role, tokens.accessToken, tokens.refreshToken);

    return res.json({
      message: 'Email signed in successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role,
      },
      tokens,
    });
  }

  // ---- EMAIL SIGNUP (Legacy) ----
  /** @deprecated Use POST /auth/users instead */
  @Post('signup')
  async signup(@Req() req: Request, @Res() res: Response) {
    const type = req.query.type as string;
    if (type !== 'email')
      throw new BadRequestException('Only email signup supported');

    return this.createUser(req, res);
  }

  // ---- REFRESH (Legacy) ----
  /** @deprecated Use POST /auth/sessions/refresh instead */
  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    return this.refreshSession(req, res);
  }

  // ---- LOGOUT (Legacy) ----
  /** @deprecated Use DELETE /auth/sessions instead */
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req: Request, @Res() res: Response) {
    return this.deleteSession(req, res);
  }

  // ---- COOKIE HELPER ----
  private setTokenCookies(
    res: Response,
    role: string,
    accessToken: string,
    refreshToken: string,
  ) {
    const isProd = process.env.NODE_ENV === 'production';
    console.log(`Setting auth cookies for role=${role} (isProd=${isProd})`);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('role', role, {
      httpOnly: false,
      secure: isProd,
      sameSite: isProd ? 'strict' : 'lax',
    });
  }
}
