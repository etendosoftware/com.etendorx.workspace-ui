import { useContext } from 'react';
import { UserContext } from '../contexts/user';

export const useUserContext = () => useContext(UserContext);
