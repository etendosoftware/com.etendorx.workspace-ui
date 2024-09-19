import { useContext } from 'react';
import { MetadataContext } from '../../../MainUI/src/contexts/metadata';

export const useMetadataContext = () => useContext(MetadataContext);

