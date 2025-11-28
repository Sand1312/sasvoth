import {
  Controller,
  Get,
  UseGuards,
  Req,
  Post,
  Res,
  NotFoundException,
  Patch,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { UsersService } from './users.service';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

class ConnectWalletDto {
  @ApiProperty()
  walletAddress: string;
}

class UpdateStateIndexDto {
  @ApiProperty()
  stateIndex: number;
}

class CreateDepositDto {
  @ApiProperty()
  amount: number;

  @ApiProperty()
  txHash: string;
}

/**
 * Users Controller - RESTful Resource-Oriented
 *
 * Resource: /users
 * Sub-resource: /users/:id/wallet
 * Sub-resource: /users/:id/state-index
 * Sub-resource: /users/:id/deposits
 *
 * GET    /users/me              - Get current user
 * GET    /users/:id             - Get user by ID
 * PATCH  /users/:id             - Update user
 * POST   /users/:id/wallet      - Connect wallet
 * PATCH  /users/:id/state-index - Update MACI state index
 * GET    /users/:id/deposits    - Get deposit history
 * POST   /users/:id/deposits    - Create deposit
 */
@Controller('users')
@ApiTags('Users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ========================================
  // RESTful Endpoints (New)
  // ========================================

  /**
   * Get current authenticated user
   * GET /users/me
   */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  async getMe(@Req() req: Request) {
    const userId = (req.user as any)?.userId;
    if (!userId) {
      throw new NotFoundException('User not found');
    }
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      user: {
        id: user._id,
        email: (user as any).email,
        name: (user as any).name,
        role: (user as any).role,
        walletAddress: (user as any).walletAddress,
        authType: (user as any).authType,
      },
    };
  }

  /**
   * Get user by ID
   * GET /users/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  async getById(@Param('id') id: string, @Res() res: Response) {
    try {
      const user = await this.usersService.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      return res.status(200).json({ user });
    } catch (error) {
      return res.status(500).json({ message: 'Error retrieving user', error });
    }
  }

  /**
   * Update user
   * PATCH /users/:id
   * Note: Implement updateUser in UsersService to enable this endpoint
   */
  // @Patch(':id')
  // @UseGuards(AuthGuard('jwt'))
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Update user' })
  // @ApiParam({ name: 'id', type: String })
  // @ApiResponse({ status: 200, description: 'User updated successfully' })
  // async update(
  //   @Param('id') id: string,
  //   @Req() req: Request,
  //   @Res() res: Response,
  // ) {
  //   try {
  //     const user = await this.usersService.updateUser(id, req.body);
  //     return res.status(200).json({ user });
  //   } catch (error) {
  //     return res.status(500).json({ message: 'Error updating user', error });
  //   }
  // }

  /**
   * Connect wallet to user
   * POST /users/:id/wallet
   */
  @Post(':id/wallet')
  @ApiOperation({ summary: 'Connect wallet to user' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: ConnectWalletDto })
  @ApiResponse({ status: 201, description: 'Wallet connected successfully' })
  async connectWallet(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { walletAddress } = req.body;
    try {
      const result = await this.usersService.connectWallet(id, walletAddress);
      if (result === true) {
        return res.status(200).json({ message: 'Wallet already connected' });
      }
      return res.status(201).json({ success: result });
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Error connecting wallet', error });
    }
  }

  /**
   * Update MACI state index
   * PATCH /users/:id/state-index
   */
  @Patch(':id/state-index')
  @ApiOperation({ summary: 'Update MACI state index' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateStateIndexDto })
  @ApiResponse({ status: 200, description: 'State index updated successfully' })
  async updateStateIndex(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { stateIndex } = req.body;
    try {
      const user = await this.usersService.updateStateIndex(id, stateIndex);
      return res.status(200).json({ user });
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Error updating state index', error });
    }
  }

  /**
   * Get deposit history
   * GET /users/:id/deposits
   */
  @Get(':id/deposits')
  @ApiOperation({ summary: 'Get deposit history' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Deposits retrieved successfully' })
  async getDeposits(@Param('id') id: string, @Res() res: Response) {
    try {
      const deposits = await this.usersService.getHistoryDeposit(id);
      return res.status(200).json({ deposits });
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Error retrieving deposits', error });
    }
  }

  /**
   * Create deposit
   * POST /users/:id/deposits
   */
  @Post(':id/deposits')
  @ApiOperation({ summary: 'Create deposit' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: CreateDepositDto })
  @ApiResponse({ status: 201, description: 'Deposit created successfully' })
  async createDeposit(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { amount, txHash } = req.body;
    try {
      const user = await this.usersService.updateBalance(id, amount, txHash);
      return res.status(201).json({ user });
    } catch (error) {
      return res.status(500).json({ message: 'Error creating deposit', error });
    }
  }

  // ========================================
  // Legacy Endpoints (Backward Compatibility)
  // ========================================

  /** @deprecated Use POST /users/:id/wallet instead */
  @Post('connectWallet')
  @ApiOperation({ summary: '[Deprecated] Connect wallet' })
  async connectWalletLegacy(@Req() req: Request, @Res() res: Response) {
    const { userId, walletAddress } = req.body;
    try {
      const result = await this.usersService.connectWallet(
        userId,
        walletAddress,
      );
      if (result === true) {
        return res.status(200).json({ message: 'Wallet already connected' });
      }
      return res.status(201).json({ success: result });
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Error connecting wallet', error });
    }
  }

  /** @deprecated Use GET /users/:id instead */
  @Get('get')
  @ApiOperation({ summary: '[Deprecated] Get user' })
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

  /** @deprecated Use GET /users/:id/deposits instead */
  @Get('historyDeposit')
  @ApiOperation({ summary: '[Deprecated] Get deposit history' })
  async getHistoryDeposit(@Req() req: Request, @Res() res: Response) {
    const userId = req.query.userId as string;
    try {
      const history = await this.usersService.getHistoryDeposit(userId);
      return res.status(200).json({ history });
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Error retrieving deposit history', error });
    }
  }

  /** @deprecated Use POST /users/:id/deposits instead */
  @Post('deposit')
  @ApiOperation({ summary: '[Deprecated] Create deposit' })
  async deposit(@Req() req: Request, @Res() res: Response) {
    const { userId, amountToken, txHash } = req.body;
    try {
      const user = await this.usersService.updateBalance(
        userId,
        amountToken,
        txHash,
      );
      return res.status(200).json({ user });
    } catch (error) {
      return res.status(500).json({ message: 'Error deposit', error });
    }
  }

  /** @deprecated Use PATCH /users/:id/state-index instead */
  @Patch('stateIndex')
  @ApiOperation({ summary: '[Deprecated] Update state index' })
  async updateStateIndexLegacy(@Req() req: Request, @Res() res: Response) {
    const { walletAddress, stateIndex } = req.body;
    try {
      const user = await this.usersService.updateStateIndex(
        walletAddress,
        stateIndex,
      );
      return res.status(200).json({ user });
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Error update stateIndex', error });
    }
  }
}
