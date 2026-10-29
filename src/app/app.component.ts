import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AnalyticsService } from './services/analytics.service';
import { PhonePreviewComponent } from './components/phone-preview/phone-preview.component';
import { WaitlistFormComponent } from './components/waitlist-form/waitlist-form.component';

@Component({
  selector: 'app-root',
  imports: [PhonePreviewComponent, WaitlistFormComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  readonly analytics = inject(AnalyticsService);
  setAnalytics(allowed: boolean): void { this.analytics.setConsent(allowed); }
  readonly year = new Date().getFullYear();
  readonly features = [
    {
      icon: 'globe',
      tint: 'purple',
      title: 'Automatic 50–30–20 rule',
      text: 'Every month, your net income is programmatically sliced into Needs, Wants and Savings. Or configure categories manually.',
    },
    {
      icon: 'pair',
      tint: 'orange',
      title: 'Built for two',
      text: "Invite your partner and see a shared household balance next to your personal one — with each person's spending in its own color.",
    },
    {
      icon: 'timer',
      tint: 'green',
      title: 'Pause before you buy',
      text: "Park something you're tempted by, wait, then choose. It's a private space — only you see it, even when you share a household.",
    },
    {
      icon: 'plus',
      tint: 'purple',
      title: 'Fast expense entry',
      text: 'Add an expense in seconds. Trifold keeps the running total and your remaining budget honest.',
    },
    {
      icon: 'chart',
      tint: 'green',
      title: 'Reports that make sense',
      text: 'Monthly graphs show where the money went by fold and by person — no finance degree required.',
    },
    {
      icon: 'coin',
      tint: 'orange',
      title: 'Your currency, your language',
      text: 'Choose English or Spanish as your app language. Supported countries and currencies will be confirmed before launch.',
    },
  ] as const;

  readonly steps = [
    {
      num: '01',
      title: 'Create your space',
      text: 'Sign in with Apple, Google or email — then pick your language and currency. Invite your partner with one tap.',
    },
    {
      num: '02',
      title: 'Set your monthly income',
      text: 'Trifold applies the 50–30–20 rule automatically — or configure custom tags for every category if you like detail.',
    },
    {
      num: '03',
      title: 'Track together',
      text: 'Log expenses and watch your personal and household balances stay in sync.',
    },
  ] as const;

  readonly faqs = [
    {
      q: 'Which countries, currencies and languages are supported?',
      a: 'Supported countries and currencies will be confirmed before launch. The app will be available in English and Spanish.',
    },
    {
      q: 'Is Trifold free?',
      a: 'Pricing and beta terms are not final yet. We will share the details before inviting you to test or asking for payment.',
    },
    {
      q: 'When does it launch?',
      a: "Trifold is in development. There is no confirmed launch date yet. Join the waitlist to hear when testing opens; joining does not guarantee access or a discount.",
    },
    {
      q: 'Do I have to connect my bank?',
      a: 'No. Trifold is manual-first: you log expenses in seconds and your balances update instantly. Nothing about your bank account is shared with us.',
    },
    {
      q: 'How does the partner view work?',
      a: "Each person keeps a personal balance, and either of you can invite the other to a household space. Each person's spending shows in their own color, so you always see who spent what.",
    },
    {
      q: 'What happens to my waitlist data?',
      a: 'This landing page collects your email for early-access updates, not financial information. Resend stores the waitlist. You can request removal from the Leave the waitlist page. We will explain app data controls before testing begins.',
    },
  ];

  readonly openFaq = signal<number | null>(null);

  toggleFaq(index: number): void {
    this.openFaq.update((current) => (current === index ? null : index));
  }

  tint(name: 'purple' | 'orange' | 'green'): { bg: string; fg: string } {
    switch (name) {
      case 'orange':
        return { bg: 'var(--orange-soft)', fg: 'var(--orange)' };
      case 'green':
        return { bg: 'var(--green-soft)', fg: 'var(--green)' };
      default:
        return { bg: 'var(--purple-soft)', fg: 'var(--purple)' };
    }
  }
}
