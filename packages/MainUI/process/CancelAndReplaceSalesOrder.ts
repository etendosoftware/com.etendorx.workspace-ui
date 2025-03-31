import { ProcessInfo } from '@workspaceui/etendohookbinder/src/api/types';

export const onLoad = (process: ProcessInfo) => alert('onLoad ' + process.searchKey);
export const onProcess = (process: ProcessInfo) => alert('onProcess ' + process.searchKey);
export const metadata = { key: 'CancelAndReplaceSalesOrder' };
