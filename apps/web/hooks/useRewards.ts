import {rewardsApi} from "../api/rewards.api";

export function useRewards() {
    const getReward = async (userId: string, pollId: string) => {
        return await rewardsApi.getReward({ userId, pollId });
    };
    const saveReward = async (userId: string, pollId: string, credit_count: number) => {
        return await rewardsApi.saveReward({ userId, pollId, credit_count });
    };
    return {
        getReward,
        saveReward,
    };
}
    