import { ErrorHandler, Injectable } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AnalyticsService } from './app/services/analytics.service';
import { AppComponent } from './app/app.component';

function reportError(kind: 'angular_error' | 'script_error' | 'unhandled_rejection'): void {
  void fetch('/api/client-error', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind }), signal: AbortSignal.timeout(4000) }).catch(() => {});
}
@Injectable()
class SafeErrorHandler implements ErrorHandler {
  handleError(): void { console.error('Trifold encountered an application error.'); reportError('angular_error'); }
}
window.addEventListener('error', () => reportError('script_error'));
window.addEventListener('unhandledrejection', () => reportError('unhandled_rejection'));
bootstrapApplication(AppComponent, {
  providers: [{ provide: ErrorHandler, useClass: SafeErrorHandler }],
}).then((app) => { void app.injector.get(AnalyticsService).initialize(); }).catch((err) => console.error(err));
