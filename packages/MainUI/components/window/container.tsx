import React from 'react';

export default function Container(props: React.PropsWithChildren<React.HTMLProps<HTMLDivElement>>) {
  return <div {...props} className={`bg-baseline-20 rounded-xl space-y-1 p-2 ${props.className}`} />;
}
