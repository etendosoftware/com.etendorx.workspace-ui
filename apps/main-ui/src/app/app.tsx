import * as React from 'react';

import NxWelcome from './nx-welcome';

import Button from 'component-library/Button';

import { Link, Route, Routes } from 'react-router-dom';

export function App() {
  return (
    <React.Suspense fallback={null}>
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Button text='Button'/>
        </li>
      </ul>
      <Routes>
        <Route path="/" element={<NxWelcome title="main-ui" />} />
      </Routes>

    </React.Suspense>
  );
}

export default App;
