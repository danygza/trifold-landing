import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

type Mode = 'personal' | 'household' | 'budgets';
type Tone = 'a' | 'b';

interface Spender {
  initial: string;
  label: string;
  spent: number;
  tone: Tone;
}

interface Category {
  name: string;
  actual: number;
  budget: number;
}

/*
 * Demo data only — none of this is real. Everything on screen is derived from
 * these numbers (budget = income - savings, percentages, remaining) so the
 * mockup can never contradict itself.
 */
const PERSONAL = { income: 22_500, savings: 4_500, spent: 6_120 };

const HOUSEHOLD = {
  income: 45_000,
  savings: 9_000,
  people: [
    { initial: 'A', label: 'Your spending', spent: 6_120, tone: 'a' },
    { initial: 'L', label: "Leo's spending", spent: 7_560, tone: 'b' },
  ] as Spender[],
};

// Budgets add up to the personal monthly budget (22,500 - 4,500 = 18,000);
// actuals add up to the personal spent amount (6,120).
const CATEGORIES: Category[] = [
  { name: 'Groceries', actual: 2_800, budget: 3_000 },
  { name: 'Dining out', actual: 1_320, budget: 1_000 },
  { name: 'Transport', actual: 1_500, budget: 2_000 },
  { name: 'Subscriptions', actual: 500, budget: 500 },
  { name: 'Rent', actual: 0, budget: 11_500 },
];

const money = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const fmt = (n: number): string => `MX$${money.format(n)}`;
const whole = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });
const fmt0 = (n: number): string => `MX$${whole.format(n)}`;
const pctOf = (part: number, whole: number): number =>
  whole > 0 ? Math.round((part / whole) * 100) : 0;

@Component({
  selector: 'app-phone-preview',
  templateUrl: './phone-preview.component.html',
  styleUrl: './phone-preview.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhonePreviewComponent {
  readonly mode = signal<Mode>('personal');
  readonly modes: { id: Mode; label: string }[] = [
    { id: 'personal', label: 'Personal' },
    { id: 'household', label: 'Household' },
    { id: 'budgets', label: 'Budgets' },
  ];

  /** Home screens (personal + household) share one balance layout. */
  readonly balance = computed(() => {
    const isHousehold = this.mode() === 'household';
    const income = isHousehold ? HOUSEHOLD.income : PERSONAL.income;
    const savings = isHousehold ? HOUSEHOLD.savings : PERSONAL.savings;
    const budget = income - savings;
    const people: Spender[] = isHousehold
      ? HOUSEHOLD.people
      : [{ initial: 'A', label: 'Your spending', spent: PERSONAL.spent, tone: 'a' }];
    const spent = people.reduce((sum, p) => sum + p.spent, 0);

    return {
      title: isHousehold ? 'Household Balance' : 'Your Balance',
      avatars: isHousehold ? HOUSEHOLD.people : people,
      budget: fmt(budget),
      income: fmt(income),
      savings: fmt(savings),
      pct: pctOf(spent, budget),
      spent: fmt(spent),
      remaining: fmt(budget - spent),
      rows: people.map((p) => ({
        ...p,
        amount: fmt(p.spent),
        share: pctOf(p.spent, budget),
        shareLabel: isHousehold ? 'of household budget' : 'of monthly budget',
      })),
    };
  });

  /** Reports screen. */
  readonly reports = computed(() => {
    const totalActual = CATEGORIES.reduce((sum, c) => sum + c.actual, 0);
    const top = CATEGORIES.reduce((a, b) => (b.actual > a.actual ? b : a));
    return {
      total: fmt(totalActual),
      topName: top.name,
      topAmount: fmt0(top.actual),
      topShare: pctOf(top.actual, totalActual),
      rows: CATEGORIES.map((c) => {
        const pct = pctOf(c.actual, c.budget);
        const over = c.actual > c.budget;
        return {
          name: c.name,
          figures: `${fmt0(c.actual)} / ${fmt0(c.budget)}`,
          pct,
          width: Math.min(pct, 100),
          over,
          note: over
            ? `${fmt0(c.actual - c.budget)} over budget · ${pct}%`
            : `${fmt0(c.budget - c.actual)} remaining · ${pct}%`,
        };
      }),
    };
  });

  setMode(mode: Mode): void {
    this.mode.set(mode);
  }
}
