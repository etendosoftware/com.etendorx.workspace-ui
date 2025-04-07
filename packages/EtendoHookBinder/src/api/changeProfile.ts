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
export const changeProfile = async (params: ChangeProfilePayload): Promise<LoginResponse> => {
    try {
        const response = await Metadata.loginClient.request<LoginResponse>(API_LOGIN_URL, {
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

        if (data.status !== 'success' || !data.token || !Array.isArray(data.roleList)) {
            throw new Error('Invalid server response');
        }

        return data;
    } catch (error) {
        console.error('Profile change error:', error);
        throw error;
    }
};
