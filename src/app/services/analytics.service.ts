import { Injectable } from '@angular/core';
import type { PostHog } from 'posthog-js';

type Event = 'waitlist_submit' | 'waitlist_success' | 'waitlist_error';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private client?: PostHog;
  private loading?: Promise<void>;

  initialize(): Promise<void> {
    return this.loading ??= this.load();
  }

  private async load(): Promise<void> {
    try {
      if (navigator.doNotTrack === '1' ||
          (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
      const response = await fetch('/.netlify/functions/analytics-config', {
        signal: AbortSignal.timeout(4000),
      });
      if (!response.ok) return;
      const { key, host } = await response.json();
      if (typeof key !== 'string' || !key ||
          !['https://us.i.posthog.com', 'https://eu.i.posthog.com'].includes(host)) return;
      const { default: posthog } = await import('posthog-js');
      posthog.init(key, {
        api_host: host,
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        capture_dead_clicks: false,
        capture_exceptions: false,
        disable_session_recording: true,
        disable_surveys: true,
        disable_external_dependency_loading: true,
        advanced_disable_feature_flags: true,
        persistence: 'memory',
        disable_persistence: true,
        person_profiles: 'never',
        respect_dnt: true,
        // Strip query strings, fragments, and referrers which can contain emails.
        before_send: (event) => {
          if (event) {
            const allowed = ['token', 'distinct_id', '$lib', '$lib_version', '$session_id',
              '$window_id', '$browser', '$browser_version', '$os', '$device_type',
              '$screen_height', '$screen_width', 'placement', 'reason'];
            event.properties = Object.fromEntries(Object.entries(event.properties)
              .filter(([key]) => allowed.includes(key)));
            event.properties['$current_url'] = location.origin + location.pathname;
          }
          return event;
        },
      });
      this.client = posthog;
      posthog.capture('$pageview');
    } catch { /* Analytics must never block a signup or page rendering. */ }
  }

  track(event: Event, placement: 'default' | 'centered', reason?: string): void {
    void this.initialize().then(() => {
      try { this.client?.capture(event, { placement, ...(reason ? { reason } : {}) }); }
      catch { /* Best effort only. No email addresses or form values are tracked. */ }
    });
  }
}
