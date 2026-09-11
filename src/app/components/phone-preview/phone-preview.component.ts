import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

type Mode = 'personal' | 'household';

@Component({
  selector: 'app-phone-preview',
  templateUrl: './phone-preview.component.html',
  styleUrl: './phone-preview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhonePreviewComponent {
  readonly mode = signal<Mode>('personal');

  setMode(mode: Mode): void {
    this.mode.set(mode);
  }
}
