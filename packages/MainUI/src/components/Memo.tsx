import { memo } from 'react';

const Memo = memo(
  (props: React.PropsWithChildren<{ id?: string }>) => <>{props.children}</>,
  (prev, next) => typeof prev.id === 'undefined' || prev.id === next.id,
);

export default Memo;
