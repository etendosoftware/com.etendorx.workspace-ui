import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Home from './screens/Home';
import Table from './screens/Table';
import Login from './screens/Login';
import Form from './screens/Form';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '',
        element: <Home />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'window/:id',
        element: <Table />,
        children: [
          {
            path: ':recordId',
            element: <Form />,
          },
        ],
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
