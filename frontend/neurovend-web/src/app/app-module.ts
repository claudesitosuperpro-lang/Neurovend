import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { apiInterceptor } from './core/interceptors/api.interceptor';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';

@NgModule({
  declarations: [App],
  imports: [BrowserModule, AppRoutingModule],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([apiInterceptor, jwtInterceptor])),
    providePrimeNG({
      theme: { preset: Aura, options: { darkModeSelector: false } },
    }),
  ],
  bootstrap: [App],
})
export class AppModule {}
