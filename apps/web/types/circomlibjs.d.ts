declare module 'circomlibjs' {
  interface Poseidon {
    (inputs: (bigint | string | number)[]): Uint8Array;
    F: {
      toObject(val: Uint8Array): bigint;
      toString(val: Uint8Array, radix?: number): string;
    };
  }
  
  export function buildPoseidon(): Promise<Poseidon>;
  export function buildEddsa(): Promise<any>;
  export function buildBabyjub(): Promise<any>;
}
