export interface AssistantUpcomingPayment {
  name: string;
  amount: number;
  dueDate: Date;
}

export interface AssistantAlert {
  tone: "success" | "warning" | "danger";
  message: string;
}

export interface FinancialSnapshot {
  totalBalance: number;
  available: number;
  dailyLimit: number;
  daysRemaining: number;
  weeklyRemaining: number;
  weeklyBudget: number;
  daysLeftInWeek: number;
  reservedFixed: number;
  groceryRemaining: number | null;
  otherBudgetsRemaining: number;
  upcomingPayments: AssistantUpcomingPayment[];
  alerts: AssistantAlert[];
  onTrack: boolean;
  averageDailySpend: number;
  projectedOverage: number;
}
