import { ProcessMetadata } from '@workspaceui/etendohookbinder/src/api/types';

export const onLoad = (process: ProcessMetadata) => alert('onLoad ' + process.searchKey);
export const onProcess = (process: ProcessMetadata) => alert('onProcess ' + process.searchKey);
