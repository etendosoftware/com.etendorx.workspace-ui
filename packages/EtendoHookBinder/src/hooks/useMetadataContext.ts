import { useContext } from 'react';
import { MetadataContext } from '../../../MainUI/src/contexts/metadata';

export const useMetadataContext = () => {
  const context = useContext(MetadataContext);

  if (context === undefined) {
    throw new Error('useMetadataContext must be used within a MetadataProvider');
  }

  return context;
};
