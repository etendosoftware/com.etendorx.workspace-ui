import { API_LOGIN_URL } from './constants';
import { Metadata } from './metadata';
import { LoginResponse } from './types';

interface ChangeProfilePayload {
    role?: string;
    warehouse?: string;
}

/**
 * Function to handle the profile change, including role and warehouse updates.
 * 
 * @param params - The profile change parameters, which may include a role and/or warehouse.
 * @returns A promise that resolves to a LoginResponse object if successful.
 */
export const changeProfile = async (params:ChangeProfilePayload): Promise<LoginResponse> => {
    try {
        const response = await Metadata.loginClient.request(API_LOGIN_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data: LoginResponse = response.data;

        if (!data.token) {
            throw new Error('Invalid server response');
        }

        return data;
    } catch (error) {
        console.error('Profile change error:', error);
        throw error;
    }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized: No token provided' });
        }

        const { role, warehouse } = req.body;
        const data = await changeProfile({ role, warehouse });

        return res.status(200).json(data);
    } catch (error) {
        console.error('Error in changeProfile API:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
