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
            children: [
              {
                path: ':id',
                Component: Form,
              },
            ],
          },
          {
            path: 'window/:id',
            Component: Table,
            children: [
              {
                path: ':recordId',
                Component: Form,
              },
            ],
          },
        ],
      },
      {
        path: 'login',
        Component: Login,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />,
);
