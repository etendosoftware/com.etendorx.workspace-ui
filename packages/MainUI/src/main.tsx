import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Home from './screens/Home';
import Table from './screens/Table';
import Login from './screens/Login';
import Form from './screens/Form';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './index.css';
import Layout from './components/layout';

const router = createBrowserRouter([
  {
    path: '',
    Component: App,
    children: [
      {
        path: '',
        Component: Layout,
        children: [
          {
            path: '',
            Component: Home,
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
      {
        path: 'login',
        element: <Login />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
