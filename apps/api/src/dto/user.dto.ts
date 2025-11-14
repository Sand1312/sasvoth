export class UserDto {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: string;
  readonly walletAddress?: string;
  readonly authType?: string;
  readonly publicKey?: string;
  readonly publicKeyX?: string;
  readonly publicKeyY?: string;
  readonly stateIndex?: number;
  readonly privateKey?: string;
}