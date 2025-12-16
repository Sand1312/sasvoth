import { Controller, Get, Req, Res, Post, Param, Query } from '@nestjs/common';
import { Request } from 'express';
import { Response } from 'express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RewardsService } from './rewards.service';

class CreateRewardDto {
  @ApiProperty()
  pollId: string;

  @ApiProperty()
  creditCount: number;
}

/**
 * Rewards Controller - RESTful Resource-Oriented
 *
 * Resource: /users/:userId/rewards (user rewards as sub-resource)
 *
 * GET    /users/:userId/rewards              - Get all rewards for user
 * GET    /users/:userId/rewards?pollId=X     - Get reward for specific poll
 * POST   /users/:userId/rewards              - Create a reward
 */
@ApiTags('User Rewards')
@ApiBearerAuth()
@Controller('users')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  // ========================================
  // RESTful Endpoints (New)
  // ========================================

  /**
   * Get rewards for a user
   * GET /users/:userId/rewards or GET /users/:userId/rewards?pollId=X
   */
  @Get(':userId/rewards')
  @ApiOperation({ summary: 'Get user rewards' })
  @ApiParam({ name: 'userId', type: String })
  @ApiQuery({ name: 'pollId', required: false })
  @ApiResponse({ status: 200, description: 'Rewards retrieved successfully' })
  async getRewards(
    @Param('userId') userId: string,
    @Query('pollId') pollId: string,
    @Res() res: Response,
  ) {
    try {
      const reward = await this.rewardsService.getReward(userId, pollId);
      if (!reward) {
        return res.status(404).json({ message: 'Reward not found' });
      }
      return res.status(200).json({ reward });
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Error retrieving reward', error: error.message });
    }
  }

  /**
   * Create a reward
   * POST /users/:userId/rewards
   */
  @Post(':userId/rewards')
  @ApiOperation({ summary: 'Create user reward' })
  @ApiParam({ name: 'userId', type: String })
  @ApiBody({ type: CreateRewardDto })
  @ApiResponse({ status: 201, description: 'Reward created successfully' })
  async createReward(
    @Param('userId') userId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const { pollId, creditCount } = req.body;
    try {
      await this.rewardsService.saveReward(userId, pollId, creditCount);
      return res.status(201).json({ message: 'Reward created successfully' });
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Error creating reward', error: error.message });
    }
  }
}

/**
 * Legacy Rewards Controller (Backward Compatibility)
 * @deprecated Use /users/:userId/rewards instead
 */
@ApiTags('Rewards (Legacy)')
@ApiBearerAuth()
@Controller('rewards')
export class RewardsLegacyController {
  constructor(private readonly rewardsService: RewardsService) {}

  /** @deprecated Use GET /users/:userId/rewards instead */
  @Get('get')
  @ApiOperation({ summary: '[Deprecated] Retrieve reward details' })
  @ApiQuery({ name: 'userId', required: true })
  @ApiQuery({ name: 'pollId', required: true })
  async getReward(@Req() req: Request, @Res() res: Response) {
    const userId = req.query.userId as string;
    const pollId = req.query.pollId as string;
    try {
      const reward = await this.rewardsService.getReward(userId, pollId);
      if (!reward) {
        return res.status(400).json({ message: 'Reward not found' });
      }
      return res.status(200).json(reward);
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Error retrieving reward', error: error.message });
    }
  }

  /** @deprecated Use POST /users/:userId/rewards instead */
  @Post('save')
  @ApiOperation({ summary: '[Deprecated] Save reward entry' })
  async saveReward(@Req() req: Request, @Res() res: Response) {
    const { userId, pollId, credit_count } = req.body;
    try {
      await this.rewardsService.saveReward(userId, pollId, credit_count);
      return res.status(201).json({ message: 'Reward saved successfully' });
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Error saving reward', error: error.message });
    }
  }

  @Get('test')
  async test(@Res() res: Response) {
    const signature = await this.rewardsService.test();
    return res.status(200).json({ signature });
  }

  @Post('generate-proof')
  async generateProof(@Req() req: Request, @Res() res: Response) {
    const input = req.body;
    try {
      const proof = await this.rewardsService.generateProof(input);
      return res.status(200).json(proof);
    } catch (error) {
      return res
        .status(500)
        .json({ message: 'Error generating proof', error: error.message });
    }
  }
}
