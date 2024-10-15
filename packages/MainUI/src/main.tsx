import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import DynamicTable from './screens/Table/Dynamic';
import Login from './screens/Login';
import Layout from './components/layout';
import DynamicForm from './screens/Form/DynamicForm';
import './index.css';

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
