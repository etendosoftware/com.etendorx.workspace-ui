import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import Home from './screens/Home';
import Table from './screens/Table';
import DynamicTable from './screens/Table/Dynamic';
import Login from './screens/Login';
import Form from './screens/Form';
import Layout from './components/layout';
import './index.css';
import DynamicFormView from './screens/Form/DynamicFormView';

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
                path: '',
                Component: Table,
              },
              {
                path: ':id',
                Component: Form,
              },
            ],
          },
          {
            path: 'window/:windowId/:recordId',
            Component: DynamicFormView,
          },
          {
            path: 'window/:windowId',
            Component: DynamicTable,
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
