import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes,  } from 'react-router-dom';
import App from './App';
import Table from './screens/Table';
import DynamicTable from './screens/Table/Dynamic';
import Login from './screens/Login';
import Home from './screens/Home';
import Layout from './components/layout';
import DynamicForm from './screens/Form/DynamicForm';
import './index.css';
import Form from './screens/Form';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />}>
        <Route path="login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />}>
            <Route index element={<Table />} />
            <Route path=":id" element={<Form />} />
          </Route>
          <Route path="window/:windowId/:tabId/:recordId" element={<DynamicForm />} />
          <Route path="window/:windowId" element={<DynamicTable />} />
        </Route>
      </Route>
    </Routes>
  </BrowserRouter>,
);
