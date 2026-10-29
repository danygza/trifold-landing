import { bootstrapApplication } from '@angular/platform-browser';
import { AnalyticsService } from './app/services/analytics.service';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, {
  providers: [],
}).then((app) => { void app.injector.get(AnalyticsService).initialize(); }).catch((err) => console.error(err));
