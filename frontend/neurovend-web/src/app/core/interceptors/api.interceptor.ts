import { HttpInterceptorFn } from '@angular/common/http';

const BASE = 'https://silent-summit-299.fly.dev';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('/api/')) {
    return next(req.clone({ url: `${BASE}${req.url}` }));
  }
  return next(req);
};
