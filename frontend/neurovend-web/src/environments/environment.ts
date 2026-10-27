const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';

export const environment = {
  production: !isLocal,
  apiUrl: isLocal ? '' : 'https://silent-summit-299.fly.dev',
};
