import { useParams } from 'react-router-dom';

export default function Form() {
  const { id, record } = useParams();

  return (
    <div>
      Tab ID: {id} - Record ID: {record}
    </div>
  );
}
