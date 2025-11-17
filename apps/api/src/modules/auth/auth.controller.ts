// src/modules/auth/auth.controller.ts
import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { Request, Response } from "express";
import { ethers } from "ethers";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  // ---- VALIDATE COOKIE ----
  @Get("validate")
  async validate(@Req() req: Request, @Res() res: Response) {
    try {
      const token = req.cookies.access_token;
      if (!token) {
        return res.status(401).json({ message: "No access token" });
      }

      const user = await this.authService.verifyAccessToken(token);
      if (!user) {
        return res.status(401).json({ message: "Invalid or expired token" });
      }

      // OK
      return res.status(200).json({ message: "Authorized", user });
    } catch (err) {
      console.error("Auth validate error:", err);
      return res.status(401).json({ message: "Unauthorized" });
    }
  }
  // ---- SIGNIN ENTRY POINT ----
  @Get("signin")
  async signin(@Req() req: Request, @Res() res: Response) {
    const type = req.query.type as string;

    switch (type) {
      case "google":
        return this.googleAuth(req, res);
      case "github":
        return this.githubAuth(req, res);
      default:
        throw new BadRequestException("Unsupported signin type");
    }
  }

  @Get("signin/callback")
  async signinCallback(@Req() req: Request, @Res() res: Response) {
    const type = req.query.type as string;

    switch (type) {
      case "google":
        return this.googleCallback(req, res);
      case "github":
        return this.githubCallback(req, res);
      default:
        throw new BadRequestException("Unsupported signin callback type");
    }
  }

  @Post("signin")
  async signinPost(@Req() req: Request, @Res() res: Response) {
    const type = req.query.type as string;

    switch (type) {
      case "wallet":
        return this.walletAuth(req, res);
      case "email":
        return this.emailSignIn(req, res);
      default:
        throw new BadRequestException("Unsupported signin type");
    }
  }

  // ---- GOOGLE ----
  @UseGuards(AuthGuard("google"))
  private async googleAuth(@Req() req: Request, @Res() res: Response) {
    // Passport tự redirect sang Google
  }

  @UseGuards(AuthGuard("google"))
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
      message: "Google sign-in successful",
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
  @UseGuards(AuthGuard("github"))
  private async githubAuth(@Req() req: Request, @Res() res: Response) {}

  @UseGuards(AuthGuard("github"))
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
      message: "GitHub sign-in successful",
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
      throw new UnauthorizedException("Address and signature are required");

    if (!ethers.utils.isAddress(address))
      throw new BadRequestException("Invalid wallet address");

    const msg = "Sign to login with MetaMask";
    const signer = ethers.utils.verifyMessage(msg, signature);
    if (signer.toLowerCase() !== address.toLowerCase())
      throw new BadRequestException("Invalid signature");

    const user = await this.authService.validateWalletUser(address, signature);
    const role = user.role;
    const tokens = await this.authService.generateTokens(user.id.toString());

    this.setTokenCookies(res, role, tokens.accessToken, tokens.refreshToken);

    return res.json({
      message: "Wallet authenticated successfully",
      user: user,
      tokens,
    });
  }

  // ---- EMAIL ----
  private async emailSignIn(@Req() req: Request, @Res() res: Response) {
    const { email, password } = req.body;
    if (!email || !password)
      throw new UnauthorizedException("Email and password are required");

    const user = await this.authService.signInEmail(email, password);
    const role = user.role;
    const tokens = await this.authService.generateTokens(user._id.toString());

    this.setTokenCookies(res, role, tokens.accessToken, tokens.refreshToken);

    return res.json({
      message: "Email signed in successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role,
      },
      tokens,
    });
  }

  // ---- EMAIL SIGNUP ----
  @Post("signup")
  async signup(@Req() req: Request, @Res() res: Response) {
    const type = req.query.type as string;
    if (type !== "email")
      throw new BadRequestException("Only email signup supported");

    const { email, password } = req.body;
    if (!email || !password)
      throw new UnauthorizedException("Email and password are required");

    const user = await this.authService.signUpEmail(email, password);
    const role = user.role;
    const tokens = await this.authService.generateTokens(user._id.toString());

    this.setTokenCookies(res, role, tokens.accessToken, tokens.refreshToken);

    return res.json({
      message: "Email signed up successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role,
      },
      tokens,
    });
  }

  // ---- REFRESH ----
  @Post("refresh")
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies.refresh_token;
    const role = req.cookies.role;
    if (!refreshToken)
      throw new UnauthorizedException("No refresh token in cookie");

    const tokens = await this.authService.refreshToken(refreshToken);
    this.setTokenCookies(res, role, tokens.accessToken, tokens.refreshToken);

    return res.json({
      message: "Tokens refreshed successfully",
      tokens,
    });
  }

  // ---- LOGOUT ----
  @Post("logout")
  @UseGuards(AuthGuard("jwt"))
  async logout(@Req() req: Request, @Res() res: Response) {
    const userId = (req.user as any).userId;
    await this.authService.logout(userId);

    res.clearCookie("access_token");
    res.clearCookie("refresh_token");
    res.clearCookie("role");

    return res.json({ message: "Logged out successfully" });
  }

  // ---- COOKIE HELPER ----
  private setTokenCookies(
    res: Response,
    role: string,
    accessToken: string,
    refreshToken: string
  ) {
    const isProd = process.env.NODE_ENV === "production";
    console.log(`Setting auth cookies for role=${role} (isProd=${isProd})`);

    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "strict" : "lax",
      path: "/",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "strict" : "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie("role", role, {
      httpOnly: false,
      secure: isProd,
      sameSite: isProd ? "strict" : "lax",
    });
  }
}
