import { createConfig, http } from 'wagmi';
import { arbitrumSepolia } from 'wagmi/chains';
import { 
  MACI,
  PollFactory,
  TallyFactory,
  MessageProcessorFactory,
  TOKEN_CONTRACT_ADDRESS,
  CLAIM_CONTRACT_ADDRESS,
  MACI_ABI,
  POLL_FACTORY_ABI,
  TALLY_FACTORY_ABI,
  MESSAGE_PROCESSOR_FACTORY_ABI,
  TOKEN_ABI,
  CLAIMING_ABI,
  CONSTANT_INITIAL_VOICE_CREDIT_PROXY_FACTORY_ABI
} from '@maci-protocol/contracts';

export const config = createConfig({
  chains: [arbitrumSepolia],
  transports: {
    [arbitrumSepolia.id]: http(process.env.NEXT_PUBLIC_ARBITRUM_SEPOLIA_RPC_URL!),
  },
});

// Contract configs để sử dụng trong hooks
export const contractConfigs = {
  MACI: {
    address: MACI as `0x${string}`,
    abi: MACI_ABI,
  },
  PollFactory: {
    address: PollFactory as `0x${string}`,
    abi: POLL_FACTORY_ABI,
  },
  TallyFactory: {
    address: TallyFactory as `0x${string}`,
    abi: TALLY_FACTORY_ABI,
  },
  MessageProcessorFactory: {
    address: MessageProcessorFactory as `0x${string}`,
    abi: MESSAGE_PROCESSOR_FACTORY_ABI,
  },
  Token: {
    address: TOKEN_CONTRACT_ADDRESS as `0x${string}`,
    abi: TOKEN_ABI,
  },
  Claiming: {
    address: CLAIM_CONTRACT_ADDRESS as `0x${string}`,
    abi: CLAIMING_ABI,
  },
  FreeForAllPolicy: "0xD60c63e972271ad39Ab8b5B62dc74f59588487d0" as `0x${string}`,
   ConstantInitialVoiceCreditProxyFactory: {
    address: "0xAe0B998B50c26239fB0902CC3878366B485F0B9b" as `0x${string}`,
    abi: CONSTANT_INITIAL_VOICE_CREDIT_PROXY_FACTORY_ABI,
  },
} as const;
