import { useContext } from 'react';
import { RecordContext } from '../contexts/record';

const useRecordContext = () => useContext(RecordContext);

export default useRecordContext;
