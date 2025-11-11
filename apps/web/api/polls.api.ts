import { api } from './base';

export const pollsApi = {
    createPoll: async ( options: string[], startTime:Date , endTime:Date ) => {
        try {
            const pollData = {
                title: 'New Poll',
                description: 'Description of the poll',
                creatorAddress: '0x9adc62ed1627ffe15e94806380782d6fe630c992',
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