import { useContext } from 'react';
import { MetadataContext } from '../contexts/metadata';

export const useMetadataContext = () => useContext(MetadataContext);

