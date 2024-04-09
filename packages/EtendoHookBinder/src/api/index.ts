import axios from 'axios';
///https://demo.etendo.cloud/
const axiosPrivate = axios.create({
  baseURL: 'http://localhost:8092', // TO-DO: change to env variable
  headers: {
    Accept: 'application/json',
  },
  withCredentials: false,
});

axiosPrivate.interceptors.request.use((config) => {
  const token = 'eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJFdGVuZG9SWCBBdXRoIiwiaWF0IjoxNzA3OTQ3NjcyLCJhZF91c2VyX2lkIjoiNUE3OTY2NzA5Njk2NEU4M0E2OTg1RDU0OUM5ODgyNzUiLCJhZF9jbGllbnRfaWQiOiIyM0M1OTU3NUI5Q0Y0NjdDOTYyMDc2MEVCMjU1QjM4OSIsImFkX29yZ19pZCI6IkI4NDNDMzA0NjFFQTQ1MDE5MzVDQjFEMTI1QzlDMjVBIiwiYWRfcm9sZV9pZCI6IjQyRDBFRUIxQzY2RjQ5N0E5MERENTI2REM1OTdFNkYwIiwic2VhcmNoX2tleSI6Im9iY29ubiIsInNlcnZpY2VfaWQiOiIwNzkzNjk2RDI1OTg0MTUwOEQ4M0VBRUZFODcwMDAwRCJ9.GhurQlHq-IEmeRNz7lTIRsNay_zONK-XjitsmGop62edCsfMk5LTBbiFKQVF0oqUSkm3Kp3gCvWns9HkGIL7EY-hCwr1GvciCa-bMPLp6VCc_tpoO89Msx_K-crfc28yxE0MemAHJaD48w-tya1bKG_qVfW3GhJaqLxIQC5MQybYhPLjC5hq6X8V5Icn3zO258QsYOYEvbk5LGPjL37tJAVRlzaAvPAWuXofh0IfPf4b0sjhXXK7PAQAohmvLp0MXaqiaL8baujXJlE50o5fQ9hhNvj_sy_xjTXSvYN1YP93wsKnRDy0Rg9T2r24hDNtT7aCKo9uKvaRx9i6_3TvHQ';
  if (token) {
    config.headers['Content-Type'] = 'application/json';
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    throw new Error('Token not found'); // TO-DO: handle error
  }
  return config;
});

export default axiosPrivate;
