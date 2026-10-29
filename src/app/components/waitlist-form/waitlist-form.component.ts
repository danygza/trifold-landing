import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';

import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-waitlist-form',
  templateUrl: './waitlist-form.component.html',
  styleUrl: './waitlist-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WaitlistFormComponent {
  private readonly analytics = inject(AnalyticsService);
  /** 'centered' renders the stacked layout used in the final CTA section. */
  readonly variant = input<'default' | 'centered'>('default');

  readonly feedbackId = `waitlist-feedback-${Math.random().toString(36).slice(2)}`;
  readonly sending = signal(false);
  readonly sent = signal(false);
  readonly failed = signal(false);
  readonly message = signal('');

  async onSubmit(event: Event, form: HTMLFormElement): Promise<void> {
    event.preventDefault();
    if (this.sending()) {
      return;
    }

    const emailInput = form.querySelector<HTMLInputElement>('input[name="email"]');
    const email = emailInput?.value.trim() ?? '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.sent.set(false);
      this.failed.set(true);
      this.message.set('Please enter a valid email address.');
      this.analytics.track('waitlist_error', this.variant(), 'invalid_email');
      return;
    }

    this.sending.set(true);
    this.sent.set(false);
    this.failed.set(false);
    this.message.set('');

    this.analytics.track('waitlist_submit', this.variant());
    const data = new FormData(form);
    try {
      const res = await fetch('/.netlify/functions/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase(), botcheck: !!data.get('botcheck') }),
        signal: AbortSignal.timeout(25000),
      });
      if (res.status === 429) throw new Error('rate_limited');
      const result = await res.json();
      if (!res.ok || result.success !== true) throw new Error('submission_failed');
      this.sent.set(true);
      this.message.set("You're on the list! We'll email you when early access is available.");
      this.analytics.track('waitlist_success', this.variant());
      form.reset();
    } catch (error) {
      const limited = error instanceof Error && error.message === 'rate_limited';
      this.failed.set(true);
      this.message.set(limited
        ? 'Too many attempts. Please wait a minute and try again.'
        : 'We couldn’t confirm your signup. Please try again in a moment.');
      this.analytics.track('waitlist_error', this.variant(), limited ? 'rate_limited' : 'submission_failed');
    } finally {
      this.sending.set(false);
    }
  }
}
