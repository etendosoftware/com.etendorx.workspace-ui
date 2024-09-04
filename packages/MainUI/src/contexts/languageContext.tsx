import { createContext } from 'react';
import { LanguageContextType } from './types';

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export default LanguageContext;
