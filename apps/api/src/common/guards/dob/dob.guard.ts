import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

/**
 * DOB Guard - Checks if user's age meets the idea's age limit requirement
 * 
 * Usage:
 * - Apply @UseGuards(DobGuard) on controller methods that fetch ideas
 * - The guard extracts ageLimit from the idea being accessed
 * - Compares user's age (from DOB) against the idea's ageLimit
 * 
 * Age limit is stored as a number in idea.ageLimit (e.g., 18, 13, 0)
 * 0 means no age limit
 */
@Injectable()
export class DobGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel('Ideas') private ideasModel: Model<any>,
    @InjectModel('Users') private usersModel: Model<any>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId || request.user?.id;
    const ideaId = request.params?.id || request.params?.ideaId || request.body?.ideaId;

    // If no idea ID, allow access (guard is not applicable)
    if (!ideaId) {
      return true;
    }

    // Fetch the idea
    const idea = await this.ideasModel.findById(ideaId).exec();
    if (!idea) {
      return true; // Let controller handle not found
    }

    // Get age limit from the idea (defaults to 0 if not set)
    const ageLimit = idea.ageLimit || 0;
    
    // If no age limit (0), allow access
    if (ageLimit === 0) {
      return true;
    }

    // If no user, deny access for age-restricted content
    if (!userId) {
      throw new ForbiddenException(
        'Authentication required to view age-restricted content',
      );
    }

    // Fetch user to get DOB
    const user = await this.usersModel.findById(userId).exec();
    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // If user has no DOB set, deny access to age-restricted content
    if (!user.dateOfBirth) {
      throw new BadRequestException(
        'Please set your date of birth in your profile to view age-restricted content',
      );
    }

    // Calculate user's age
    const userAge = this.calculateAge(new Date(user.dateOfBirth));

    // Check if user meets age requirement
    if (userAge < ageLimit) {
      throw new ForbiddenException(
        `You must be at least ${ageLimit} years old to view this content`,
      );
    }

    return true;
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}
