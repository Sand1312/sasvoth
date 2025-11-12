import { api } from './base';

export const pollsApi = {

    createPoll: async ( options: string[], startTime:Date , endTime:Date,creatorAddress :string ) => {
        try {
            const pollData = {
                title: 'New Poll',
                description: 'Description of the poll',
                creatorAddress: creatorAddress,
                status: 'active',
                startTime: startTime,
                endTime: endTime,
                options: options,
            };
            const response = await api.post('/polls/createPoll', pollData);
            return response.data;
        }catch (error) {
            throw error;
        }
    },
    getPollsByType: async () => {
        try {
            const status = 'active';
            const response = await api.get(`/polls/getPollsByType?status=${status}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};