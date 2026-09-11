import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-waitlist-form',
  templateUrl: './waitlist-form.component.html',
  styleUrl: './waitlist-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WaitlistFormComponent {
  /** 'centered' renders the stacked layout used in the final CTA section. */
  readonly variant = input<'default' | 'centered'>('default');

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
      return;
    }

    this.sending.set(true);
    this.sent.set(false);
    this.failed.set(false);
    this.message.set('');

    const data = new FormData(form);
    // Replies from the inbox go straight to the person who signed up
    data.set('replyto', email);

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: data,
      });
      if (res.ok) {
        this.sent.set(true);
        this.message.set("You're on the list — see you at launch. 🎉");
        form.reset();
      } else {
        throw new Error('bad status');
      }
    } catch {
      this.failed.set(true);
      this.message.set('Something went wrong — try again in a moment.');
    } finally {
      this.sending.set(false);
    }
  }
}
