import data from "./data.json" assert { type: "json" };

export type Idea = typeof data.ideas[number];
export type Poll = typeof data.polls[number];
export type Vote = typeof data.votes[number];
export type VoiceCredit = typeof data.voiceCredits[number];
export type ResultMeta = typeof data.resultsMeta[number];
export type Reward = typeof data.rewards[number];

const state = {
  ideas: [...data.ideas],
  polls: [...data.polls],
  votes: [...data.votes],
  voiceCredits: [...data.voiceCredits],
  resultsMeta: [...data.resultsMeta],
  rewards: [...data.rewards],
};

export function nextId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export const db = {
  ideas: state.ideas,
  polls: state.polls,
  votes: state.votes,
  voiceCredits: state.voiceCredits,
  resultsMeta: state.resultsMeta,
  rewards: state.rewards,
};
