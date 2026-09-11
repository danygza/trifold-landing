import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
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
      icon: 'split',
      tint: 'green',
      title: 'Split shared costs',
      text: "Rent, groceries, the dog's vet bill — split any expense fairly between partners and watch both balances update instantly.",
    },
    {
      icon: 'plus',
      tint: 'purple',
      title: 'Fast expense entry',
      text: 'Add an expense in seconds. Tag it, split it or leave it — Trifold keeps the running total and your remaining budget honest.',
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
      text: 'All countries and all currencies are supported. Choose English or Spanish as your app language.',
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
      text: 'Log expenses, split shared costs, and watch your personal and household balances stay in sync.',
    },
  ] as const;

  readonly faqs = [
    {
      q: 'Which countries, currencies and languages are supported?',
      a: 'Trifold supports all countries and all currencies. The app is available in English and Spanish only.',
    },
    {
      q: 'Is Trifold free?',
      a: 'Trifold is free during the beta. At launch there will be a free tier and an affordable plus tier — early waitlist members get founder pricing.',
    },
    {
      q: 'When does it launch?',
      a: "We're onboarding waitlist members in order starting early 2027. Joining the list locks your spot and your founder discount.",
    },
    {
      q: 'Do I have to connect my bank?',
      a: 'No. Trifold is manual-first: you log expenses in seconds and your balances update instantly. Nothing about your bank account is shared with us.',
    },
    {
      q: 'How does the partner view work?',
      a: 'Each person keeps a personal balance, and either of you can invite the other to a household space. Shared spending shows in both colors, and either partner can split any cost.',
    },
    {
      q: 'Is my financial data safe?',
      a: 'Yes. Your data is encrypted in transit and at rest, and we never sell your information. You can export or delete everything at any time.',
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
