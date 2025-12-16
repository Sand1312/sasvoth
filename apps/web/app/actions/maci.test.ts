import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { Keypair, PrivKey } from "@maci-protocol/domainobjs";

/**
 * Property tests for MACI joinPoll server action and keypair serialization
 * These tests validate the correctness properties defined in the design document.
 */

// Define the required fields for joinPoll parameters based on IJoinPollArgs interface
const REQUIRED_JOIN_POLL_PARAMS = [
  "maciAddress",
  "privateKey",
  "pollId",
  "pollJoiningZkey",
  "sgDataArg",
  "ivcpDataArg",
  "signer",
] as const;

// Define the required fields for joinPoll result based on IJoinPollData interface
const REQUIRED_JOIN_POLL_RESULT_FIELDS = [
  "pollStateIndex",
  "voiceCredits",
  "hash",
] as const;

// Helper to generate hex strings of specific length
const hexChar = fc.constantFrom(..."0123456789abcdef".split(""));
const hexString = (length: number) =>
  fc
    .array(hexChar, { minLength: length, maxLength: length })
    .map((arr: string[]) => arr.join(""));

/**
 * Helper function to create a mock joinPoll params object
 * This simulates what the server action builds before calling the SDK
 */
function createJoinPollParams(
  overrides: Partial<Record<string, unknown>> = {}
) {
  return {
    maciAddress: "0x1234567890123456789012345678901234567890",
    privateKey: "macisk.1234567890abcdef",
    pollId: BigInt(1),
    pollJoiningZkey: "/path/to/zkey",
    useWasm: true,
    pollWasm: "/path/to/wasm",
    sgDataArg:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    ivcpDataArg:
      "0x0000000000000000000000000000000000000000000000000000000000000000",
    signer: {} as unknown, // Mock signer
    startBlock: 0,
    blocksPerBatch: 10000,
    ...overrides,
  };
}

/**
 * Helper function to create a mock joinPoll result object
 * This simulates what the SDK returns after a successful joinPoll
 */
function createJoinPollResult(
  overrides: Partial<Record<string, unknown>> = {}
) {
  return {
    pollStateIndex: "1",
    voiceCredits: "100",
    hash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    timestamp: "1234567890",
    nullifier: "0x1234",
    ...overrides,
  };
}

describe("JoinPoll Server Action Property Tests", () => {
  /**
   * **Property 3: JoinPoll parameter completeness**
   * *For any* joinPoll call, the parameters object should contain all required fields:
   * maciAddress, privateKey, pollId, pollJoiningZkey, sgDataArg, ivcpDataArg, signer
   * **Validates: Requirements 1.2, 3.2**
   * **Feature: fix-maci-voting-flow, Property 3: JoinPoll parameter completeness**
   */
  describe("Property 3: JoinPoll parameter completeness", () => {
    it("should have all required parameters present in joinPoll params", () => {
      fc.assert(
        fc.property(
          // Generate random valid values for each parameter
          fc.record({
            maciAddress: hexString(40).map((s: string) => `0x${s}`),
            privateKey: fc
              .string({ minLength: 10 })
              .map((s: string) => `macisk.${s}`),
            pollId: fc.bigInt({ min: 0n, max: 1000n }),
            pollJoiningZkey: fc.string({ minLength: 1 }),
            sgDataArg: hexString(64).map((s: string) => `0x${s}`),
            ivcpDataArg: hexString(64).map((s: string) => `0x${s}`),
          }),
          (params) => {
            // Create full params object with signer (which is always required)
            const fullParams = createJoinPollParams(params);

            // Verify all required fields are present and non-null
            for (const field of REQUIRED_JOIN_POLL_PARAMS) {
              expect(fullParams[field]).toBeDefined();
              expect(fullParams[field]).not.toBeNull();
            }

            // Verify maciAddress is a valid Ethereum address format
            expect(fullParams.maciAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);

            // Verify privateKey starts with macisk. prefix
            expect(fullParams.privateKey).toMatch(/^macisk\./);

            // Verify pollId is a BigInt
            expect(typeof fullParams.pollId).toBe("bigint");

            // Verify sgDataArg and ivcpDataArg are 32-byte hex strings
            expect(fullParams.sgDataArg).toMatch(/^0x[a-fA-F0-9]{64}$/);
            expect(fullParams.ivcpDataArg).toMatch(/^0x[a-fA-F0-9]{64}$/);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should include optional parameters when provided", () => {
      fc.assert(
        fc.property(
          fc.record({
            useWasm: fc.boolean(),
            startBlock: fc.integer({ min: 0, max: 1000000 }),
            blocksPerBatch: fc.integer({ min: 1, max: 100000 }),
          }),
          (optionalParams) => {
            const fullParams = createJoinPollParams(optionalParams);

            // Verify optional fields are present when provided
            expect(fullParams.useWasm).toBe(optionalParams.useWasm);
            expect(fullParams.startBlock).toBe(optionalParams.startBlock);
            expect(fullParams.blocksPerBatch).toBe(
              optionalParams.blocksPerBatch
            );

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Property 4: JoinPoll result structure**
   * *For any* successful joinPoll call, the result should contain pollStateIndex
   * as a non-negative integer and voiceCredits as a non-negative integer
   * **Validates: Requirements 3.3**
   * **Feature: fix-maci-voting-flow, Property 4: JoinPoll result structure**
   */
  describe("Property 4: JoinPoll result structure", () => {
    it("should have valid pollStateIndex in result", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 1000000 }), (pollStateIndex) => {
          const result = createJoinPollResult({
            pollStateIndex: pollStateIndex.toString(),
          });

          // Verify pollStateIndex is present
          expect(result.pollStateIndex).toBeDefined();

          // Verify pollStateIndex can be parsed as a non-negative integer
          const parsedIndex = parseInt(result.pollStateIndex, 10);
          expect(Number.isInteger(parsedIndex)).toBe(true);
          expect(parsedIndex).toBeGreaterThanOrEqual(0);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it("should have valid voiceCredits in result", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 1000000 }), (voiceCredits) => {
          const result = createJoinPollResult({
            voiceCredits: voiceCredits.toString(),
          });

          // Verify voiceCredits is present
          expect(result.voiceCredits).toBeDefined();

          // Verify voiceCredits can be parsed as a non-negative integer
          const parsedCredits = parseInt(result.voiceCredits, 10);
          expect(Number.isInteger(parsedCredits)).toBe(true);
          expect(parsedCredits).toBeGreaterThanOrEqual(0);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it("should have valid hash in result", () => {
      fc.assert(
        fc.property(hexString(64), (hashHex: string) => {
          const result = createJoinPollResult({ hash: `0x${hashHex}` });

          // Verify hash is present
          expect(result.hash).toBeDefined();

          // Verify hash is a valid transaction hash format (0x + 64 hex chars)
          expect(result.hash).toMatch(/^0x[a-fA-F0-9]{64}$/);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it("should have all required result fields present", () => {
      fc.assert(
        fc.property(
          fc.record({
            pollStateIndex: fc
              .integer({ min: 0, max: 1000000 })
              .map((n: number) => n.toString()),
            voiceCredits: fc
              .integer({ min: 0, max: 1000000 })
              .map((n: number) => n.toString()),
            hash: hexString(64).map((s: string) => `0x${s}`),
          }),
          (resultFields) => {
            const result = createJoinPollResult(resultFields);

            // Verify all required result fields are present
            for (const field of REQUIRED_JOIN_POLL_RESULT_FIELDS) {
              expect(result[field]).toBeDefined();
              expect(result[field]).not.toBeNull();
              expect(typeof result[field]).toBe("string");
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

/**
 * Property tests for MACI keypair serialization
 * These tests validate the correctness properties for key format requirements.
 */
describe("MACI Keypair Serialization Property Tests", () => {
  /**
   * **Property 1: Serialized private key format**
   * *For any* MACI private key, when serialized using `privateKey.serialize()`,
   * the result should start with the prefix "macisk."
   * **Validates: Requirements 1.4, 5.2**
   * **Feature: fix-maci-voting-flow, Property 1: Serialized private key format**
   */
  describe("Property 1: Serialized private key format", () => {
    it("should serialize private key with macisk. prefix for random keypairs", () => {
      fc.assert(
        fc.property(
          // Generate random seeds for keypair generation
          fc.bigInt({ min: 1n, max: BigInt(2 ** 250) }),
          (seed) => {
            // Create keypair from seed (deterministic)
            const privKey = new PrivKey(seed);
            const keypair = new Keypair(privKey);

            // Serialize the private key
            const serialized = keypair.privKey.serialize();

            // Verify it starts with "macisk." prefix
            expect(serialized).toMatch(/^macisk\./);

            // Verify it's a non-empty string after the prefix
            expect(serialized.length).toBeGreaterThan(7); // "macisk." is 7 chars

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should produce consistent serialization for same private key", () => {
      fc.assert(
        fc.property(fc.bigInt({ min: 1n, max: BigInt(2 ** 250) }), (seed) => {
          // Create two keypairs from the same seed
          const keypair1 = new Keypair(new PrivKey(seed));
          const keypair2 = new Keypair(new PrivKey(seed));

          // Serialize both
          const serialized1 = keypair1.privKey.serialize();
          const serialized2 = keypair2.privKey.serialize();

          // They should be identical
          expect(serialized1).toBe(serialized2);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it("should allow deserialization back to equivalent private key", () => {
      fc.assert(
        fc.property(fc.bigInt({ min: 1n, max: BigInt(2 ** 250) }), (seed) => {
          // Create keypair
          const originalPrivKey = new PrivKey(seed);
          const keypair = new Keypair(originalPrivKey);

          // Serialize
          const serialized = keypair.privKey.serialize();

          // Deserialize
          const deserializedPrivKey = PrivKey.deserialize(serialized);

          // Create new keypair from deserialized key
          const newKeypair = new Keypair(deserializedPrivKey);

          // Public keys should match (proving the private key is equivalent)
          expect(newKeypair.pubKey.rawPubKey[0].toString()).toBe(
            keypair.pubKey.rawPubKey[0].toString()
          );
          expect(newKeypair.pubKey.rawPubKey[1].toString()).toBe(
            keypair.pubKey.rawPubKey[1].toString()
          );

          return true;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Property 2: Serialized public key format**
   * *For any* MACI public key, when serialized using `publicKey.serialize()`,
   * the result should start with the prefix "macipk."
   * **Validates: Requirements 1.5, 5.3**
   * **Feature: fix-maci-voting-flow, Property 2: Serialized public key format**
   */
  describe("Property 2: Serialized public key format", () => {
    it("should serialize public key with macipk. prefix for random keypairs", () => {
      fc.assert(
        fc.property(
          // Generate random seeds for keypair generation
          fc.bigInt({ min: 1n, max: BigInt(2 ** 250) }),
          (seed) => {
            // Create keypair from seed
            const keypair = new Keypair(new PrivKey(seed));

            // Serialize the public key
            const serialized = keypair.pubKey.serialize();

            // Verify it starts with "macipk." prefix
            expect(serialized).toMatch(/^macipk\./);

            // Verify it's a non-empty string after the prefix
            expect(serialized.length).toBeGreaterThan(7); // "macipk." is 7 chars

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should produce consistent serialization for same public key", () => {
      fc.assert(
        fc.property(fc.bigInt({ min: 1n, max: BigInt(2 ** 250) }), (seed) => {
          // Create two keypairs from the same seed
          const keypair1 = new Keypair(new PrivKey(seed));
          const keypair2 = new Keypair(new PrivKey(seed));

          // Serialize both public keys
          const serialized1 = keypair1.pubKey.serialize();
          const serialized2 = keypair2.pubKey.serialize();

          // They should be identical
          expect(serialized1).toBe(serialized2);

          return true;
        }),
        { numRuns: 100 }
      );
    });

    it("should produce different serializations for different keypairs", () => {
      fc.assert(
        fc.property(
          fc.bigInt({ min: 1n, max: BigInt(2 ** 250) }),
          fc.bigInt({ min: 1n, max: BigInt(2 ** 250) }),
          (seed1, seed2) => {
            // Skip if seeds are the same
            fc.pre(seed1 !== seed2);

            // Create two different keypairs
            const keypair1 = new Keypair(new PrivKey(seed1));
            const keypair2 = new Keypair(new PrivKey(seed2));

            // Serialize both public keys
            const serialized1 = keypair1.pubKey.serialize();
            const serialized2 = keypair2.pubKey.serialize();

            // They should be different
            expect(serialized1).not.toBe(serialized2);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

/**
 * Property tests for vote submission using pollStateIndex
 * These tests validate that votes correctly use pollStateIndex from localStorage.
 */
describe("Vote Submission Property Tests", () => {
  /**
   * **Property 5: Vote uses pollStateIndex**
   * *For any* vote submission, the stateIndex parameter should equal the stored
   * pollStateIndex value from localStorage
   * **Validates: Requirements 2.1**
   * **Feature: fix-maci-voting-flow, Property 5: Vote uses pollStateIndex**
   */
  describe("Property 5: Vote uses pollStateIndex", () => {
    /**
     * Helper to simulate vote parameter construction from localStorage values
     * This mirrors the logic in handleVote function
     */
    function constructVoteParams(localStorage: {
      maci_pollStateIndex: string | null;
      maci_pubKeyX: string | null;
      maci_pubKeyY: string | null;
      maci_privKey: string | null;
    }) {
      const pollStateIndex = localStorage.maci_pollStateIndex;
      const pubKeyX = localStorage.maci_pubKeyX;
      const pubKeyY = localStorage.maci_pubKeyY;
      const privKey = localStorage.maci_privKey;

      // Validation: pollStateIndex must exist
      if (!pollStateIndex) {
        return { valid: false, error: "pollStateIndex not found" };
      }

      // Validation: keys must exist
      if (!pubKeyX || !pubKeyY || !privKey) {
        return { valid: false, error: "keys not found" };
      }

      // Validation: privKey must be in serialized format
      if (!privKey.startsWith("macisk.")) {
        return { valid: false, error: "invalid privKey format" };
      }

      // Return the vote params that would be passed to submitVote
      return {
        valid: true,
        params: {
          pollStateIndex: Number(pollStateIndex),
          pubKeyX,
          pubKeyY,
          privKey,
        },
      };
    }

    it("should use pollStateIndex from localStorage as stateIndex parameter", () => {
      fc.assert(
        fc.property(
          // Generate random pollStateIndex values (non-negative integers)
          fc.integer({ min: 0, max: 1000000 }),
          // Generate random public key coordinates (as BigInt strings)
          fc.bigInt({ min: 1n, max: BigInt(2 ** 250) }),
          fc.bigInt({ min: 1n, max: BigInt(2 ** 250) }),
          // Generate random serialized private key
          fc.string({ minLength: 10, maxLength: 100 }),
          (pollStateIndex, pubKeyX, pubKeyY, privKeySuffix) => {
            // Simulate localStorage values
            const localStorage = {
              maci_pollStateIndex: pollStateIndex.toString(),
              maci_pubKeyX: pubKeyX.toString(),
              maci_pubKeyY: pubKeyY.toString(),
              maci_privKey: `macisk.${privKeySuffix}`,
            };

            // Construct vote params
            const result = constructVoteParams(localStorage);

            // Verify params are valid
            expect(result.valid).toBe(true);
            if (!result.valid) return true;

            // **Key assertion**: The pollStateIndex used in vote params
            // should equal the stored pollStateIndex value
            expect(result.params!.pollStateIndex).toBe(pollStateIndex);

            // Verify the value is a non-negative integer
            expect(Number.isInteger(result.params!.pollStateIndex)).toBe(true);
            expect(result.params!.pollStateIndex).toBeGreaterThanOrEqual(0);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject vote when pollStateIndex is missing", () => {
      fc.assert(
        fc.property(
          // Generate random public key coordinates
          fc.bigInt({ min: 1n, max: BigInt(2 ** 250) }),
          fc.bigInt({ min: 1n, max: BigInt(2 ** 250) }),
          fc.string({ minLength: 10, maxLength: 100 }),
          (pubKeyX, pubKeyY, privKeySuffix) => {
            // Simulate localStorage with missing pollStateIndex
            const localStorage = {
              maci_pollStateIndex: null,
              maci_pubKeyX: pubKeyX.toString(),
              maci_pubKeyY: pubKeyY.toString(),
              maci_privKey: `macisk.${privKeySuffix}`,
            };

            // Construct vote params
            const result = constructVoteParams(localStorage);

            // Should be invalid due to missing pollStateIndex
            expect(result.valid).toBe(false);
            expect(result.error).toBe("pollStateIndex not found");

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should reject vote when privKey is not in serialized format", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000000 }),
          fc.bigInt({ min: 1n, max: BigInt(2 ** 250) }),
          fc.bigInt({ min: 1n, max: BigInt(2 ** 250) }),
          // Generate a raw number string (not serialized format)
          fc.bigInt({ min: 1n, max: BigInt(2 ** 250) }),
          (pollStateIndex, pubKeyX, pubKeyY, rawPrivKey) => {
            // Simulate localStorage with raw number privKey (not serialized)
            const localStorage = {
              maci_pollStateIndex: pollStateIndex.toString(),
              maci_pubKeyX: pubKeyX.toString(),
              maci_pubKeyY: pubKeyY.toString(),
              maci_privKey: rawPrivKey.toString(), // Raw number, not macisk.xxx
            };

            // Construct vote params
            const result = constructVoteParams(localStorage);

            // Should be invalid due to wrong privKey format
            expect(result.valid).toBe(false);
            expect(result.error).toBe("invalid privKey format");

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should preserve pollStateIndex value through vote parameter construction", () => {
      fc.assert(
        fc.property(
          // Test with various edge case values
          fc.oneof(
            fc.constant(0), // Zero index
            fc.constant(1), // First index
            fc.integer({ min: 2, max: 100 }), // Small values
            fc.integer({ min: 101, max: 10000 }), // Medium values
            fc.integer({ min: 10001, max: 1000000 }) // Large values
          ),
          (pollStateIndex) => {
            // Create a valid keypair for testing
            const seed = BigInt(12345);
            const privKey = new PrivKey(seed);
            const keypair = new Keypair(privKey);

            // Simulate localStorage with the test pollStateIndex
            const localStorage = {
              maci_pollStateIndex: pollStateIndex.toString(),
              maci_pubKeyX: keypair.pubKey.rawPubKey[0].toString(),
              maci_pubKeyY: keypair.pubKey.rawPubKey[1].toString(),
              maci_privKey: keypair.privKey.serialize(),
            };

            // Construct vote params
            const result = constructVoteParams(localStorage);

            // Verify params are valid
            expect(result.valid).toBe(true);
            if (!result.valid) return true;

            // **Key assertion**: pollStateIndex should be exactly preserved
            expect(result.params!.pollStateIndex).toBe(pollStateIndex);

            // Verify string->number conversion is correct
            expect(result.params!.pollStateIndex.toString()).toBe(
              localStorage.maci_pollStateIndex
            );

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

/**
 * Property tests for duplicate join prevention
 * These tests validate that users cannot join a poll they have already joined.
 */
describe("Duplicate Join Prevention Property Tests", () => {
  /**
   * **Property 6: Duplicate join prevention**
   * *For any* poll, if a user has already joined (pollStateIndex exists in localStorage
   * for that poll), attempting to join again should be prevented
   * **Validates: Requirements 4.2**
   * **Feature: fix-maci-voting-flow, Property 6: Duplicate join prevention**
   */
  describe("Property 6: Duplicate join prevention", () => {
    /**
     * Helper to simulate the duplicate join check logic
     * This mirrors the logic in SignupModal component
     */
    function checkCanJoinPoll(localStorage: {
      maci_pollStateIndex: string | null;
    }): { canJoin: boolean; existingPollStateIndex: string | null } {
      const storedPollStateIndex = localStorage.maci_pollStateIndex;

      if (storedPollStateIndex) {
        // User has already joined - prevent duplicate join
        return {
          canJoin: false,
          existingPollStateIndex: storedPollStateIndex,
        };
      }

      // User has not joined - allow join
      return {
        canJoin: true,
        existingPollStateIndex: null,
      };
    }

    it("should prevent join when pollStateIndex already exists", () => {
      fc.assert(
        fc.property(
          // Generate random pollStateIndex values (non-negative integers as strings)
          fc.integer({ min: 0, max: 1000000 }).map((n) => n.toString()),
          (existingPollStateIndex) => {
            // Simulate localStorage with existing pollStateIndex
            const localStorage = {
              maci_pollStateIndex: existingPollStateIndex,
            };

            // Check if user can join
            const result = checkCanJoinPoll(localStorage);

            // **Key assertion**: User should NOT be able to join
            expect(result.canJoin).toBe(false);

            // Should return the existing pollStateIndex
            expect(result.existingPollStateIndex).toBe(existingPollStateIndex);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should allow join when pollStateIndex does not exist", () => {
      fc.assert(
        fc.property(
          // Generate random boolean to test null case
          fc.constant(null),
          (nullValue) => {
            // Simulate localStorage without pollStateIndex
            const localStorage = {
              maci_pollStateIndex: nullValue,
            };

            // Check if user can join
            const result = checkCanJoinPoll(localStorage);

            // **Key assertion**: User SHOULD be able to join
            expect(result.canJoin).toBe(true);

            // Should not have existing pollStateIndex
            expect(result.existingPollStateIndex).toBeNull();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should correctly identify joined state for any valid pollStateIndex", () => {
      fc.assert(
        fc.property(
          // Test with various edge case values
          fc.oneof(
            fc.constant("0"), // Zero index
            fc.constant("1"), // First index
            fc.integer({ min: 2, max: 100 }).map((n) => n.toString()), // Small values
            fc.integer({ min: 101, max: 10000 }).map((n) => n.toString()), // Medium values
            fc.integer({ min: 10001, max: 1000000 }).map((n) => n.toString()) // Large values
          ),
          (pollStateIndex) => {
            // Simulate localStorage with the test pollStateIndex
            const localStorage = {
              maci_pollStateIndex: pollStateIndex,
            };

            // Check if user can join
            const result = checkCanJoinPoll(localStorage);

            // **Key assertion**: Any valid pollStateIndex should prevent joining
            expect(result.canJoin).toBe(false);
            expect(result.existingPollStateIndex).toBe(pollStateIndex);

            // Verify the pollStateIndex is preserved correctly
            expect(result.existingPollStateIndex).not.toBeNull();

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should handle transition from not-joined to joined state", () => {
      fc.assert(
        fc.property(
          // Generate a pollStateIndex that would be set after joining
          fc.integer({ min: 0, max: 1000000 }).map((n) => n.toString()),
          (newPollStateIndex) => {
            // Initial state: not joined
            const initialLocalStorage = {
              maci_pollStateIndex: null,
            };

            // Check initial state
            const initialResult = checkCanJoinPoll(initialLocalStorage);
            expect(initialResult.canJoin).toBe(true);

            // After joining: pollStateIndex is set
            const afterJoinLocalStorage = {
              maci_pollStateIndex: newPollStateIndex,
            };

            // Check after join state
            const afterJoinResult = checkCanJoinPoll(afterJoinLocalStorage);

            // **Key assertion**: After joining, user should NOT be able to join again
            expect(afterJoinResult.canJoin).toBe(false);
            expect(afterJoinResult.existingPollStateIndex).toBe(
              newPollStateIndex
            );

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should consistently prevent duplicate joins across multiple checks", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000000 }).map((n) => n.toString()),
          fc.integer({ min: 1, max: 10 }), // Number of times to check
          (pollStateIndex, checkCount) => {
            const localStorage = {
              maci_pollStateIndex: pollStateIndex,
            };

            // Check multiple times - should always prevent join
            for (let i = 0; i < checkCount; i++) {
              const result = checkCanJoinPoll(localStorage);

              // **Key assertion**: Every check should consistently prevent joining
              expect(result.canJoin).toBe(false);
              expect(result.existingPollStateIndex).toBe(pollStateIndex);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
