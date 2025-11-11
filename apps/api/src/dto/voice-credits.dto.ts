// src/voice-credits/dto/create-voice-credits.dto.ts
export class CreateVoiceCreditsDto {
  readonly userId: string;
  readonly credits: number;
  readonly pollId: string;
  readonly isActive?: boolean;
}

// src/voice-credits/dto/update-voice-credits.dto.ts
export class UpdateVoiceCreditsDto {
  readonly credits?: number;
  readonly isActive?: boolean;
}

// src/voice-credits/dto/assign-credits.dto.ts
export class AssignCreditsDto {
  readonly userId: string;
  readonly pollId: string;
  readonly credits: number;
}