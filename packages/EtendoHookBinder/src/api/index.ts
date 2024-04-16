import axios from 'axios';

const axiosPrivate = axios.create({
  baseURL: 'http://localhost:5173', // TO-DO: change to env variable
  withCredentials: false,
});

axiosPrivate.interceptors.request.use((config) => {
  const token = "TOKEN"
  if (token) {
    config.headers['Content-Type'] = 'application/json';
    config.headers.Authorization = `Bearer ${token}`;
    config.headers.Accept = 'application/json';
    config.headers['Access-Control-Allow-Origin'] = '*';
  } else {
    throw new Error('Token not found'); // TO-DO: handle error
  }
  return config;
});

export default axiosPrivate;
