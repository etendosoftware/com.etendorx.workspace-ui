// Mock más completo para Next.js navigation
const mockRouter = {
  push: (url) => {
    console.log(`[MOCK] Router push: ${url}`);
    return Promise.resolve(true);
  },
  replace: (url) => {
    console.log(`[MOCK] Router replace: ${url}`);
    return Promise.resolve(true);
  },
  prefetch: (url) => {
    console.log(`[MOCK] Router prefetch: ${url}`);
    return Promise.resolve();
  },
  back: () => console.log('[MOCK] Router back'),
  forward: () => console.log('[MOCK] Router forward'),
  refresh: () => console.log('[MOCK] Router refresh'),
  pathname: '/',
  query: {},
  asPath: '/',
  route: '/',
  events: {
    on: () => {},
    off: () => {},
    emit: () => {}
  }
};

export const useRouter = () => mockRouter;
export const usePathname = () => '/';
export const useSearchParams = () => new URLSearchParams();
export const useParams = () => ({});

// Simular AppRouterContext que Next.js usa internamente
export const AppRouterContext = {
  Provider: ({ children }) => children
};