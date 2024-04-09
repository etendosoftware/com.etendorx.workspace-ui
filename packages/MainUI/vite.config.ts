import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/sws/view': 'http://localhost:8092'
    }
    // proxy: {
    //   '/sws/view': {
    //     target: 'http://localhost:8092',
    //     changeOrigin: true,
    //     secure: false,
    //     headers: {
    //       Accept: 'application/json',
    //       'Content-Type': 'application/json', 
    //       //Autorization: 'Bearer eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJFdGVuZG9SWCBBdXRoIiwiaWF0IjoxNzA3OTQ3NjcyLCJhZF91c2VyX2lkIjoiNUE3OTY2NzA5Njk2NEU4M0E2OTg1RDU0OUM5ODgyNzUiLCJhZF9jbGllbnRfaWQiOiIyM0M1OTU3NUI5Q0Y0NjdDOTYyMDc2MEVCMjU1QjM4OSIsImFkX29yZ19pZCI6IkI4NDNDMzA0NjFFQTQ1MDE5MzVDQjFEMTI1QzlDMjVBIiwiYWRfcm9sZV9pZCI6IjQyRDBFRUIxQzY2RjQ5N0E5MERENTI2REM1OTdFNkYwIiwic2VhcmNoX2tleSI6Im9iY29ubiIsInNlcnZpY2VfaWQiOiIwNzkzNjk2RDI1OTg0MTUwOEQ4M0VBRUZFODcwMDAwRCJ9.GhurQlHq-IEmeRNz7lTIRsNay_zONK-XjitsmGop62edCsfMk5LTBbiFKQVF0oqUSkm3Kp3gCvWns9HkGIL7EY-hCwr1GvciCa-bMPLp6VCc_tpoO89Msx_K-crfc28yxE0MemAHJaD48w-tya1bKG_qVfW3GhJaqLxIQC5MQybYhPLjC5hq6X8V5Icn3zO258QsYOYEvbk5LGPjL37tJAVRlzaAvPAWuXofh0IfPf4b0sjhXXK7PAQAohmvLp0MXaqiaL8baujXJlE50o5fQ9hhNvj_sy_xjTXSvYN1YP93wsKnRDy0Rg9T2r24hDNtT7aCKo9uKvaRx9i6_3TvHQ'
    //     },
    //   }
    // }
  },
  build: {
    outDir: '../../src/main/resources/static'
  }
})
