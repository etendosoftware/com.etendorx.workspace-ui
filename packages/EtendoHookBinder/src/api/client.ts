import axios from 'axios';
import { TOKEN } from './constants';

export function newClient(baseURL: string) {
  return axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Authorization: `Basic ${TOKEN}`,
    },
  });
}