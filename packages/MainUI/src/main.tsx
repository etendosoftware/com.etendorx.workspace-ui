import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import Table from './screens/Table';
import DynamicTable from './screens/Table/Dynamic';
import Login from './screens/Login';
import Home from './screens/Home';
import Layout from './components/layout';
import DynamicForm from './screens/Form/DynamicForm';
import './index.css';
import Form from './screens/Form';

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
            Component: DynamicForm,
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

ReactDOM.createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
