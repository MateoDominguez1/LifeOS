import { differenceInCalendarDays, startOfDay } from "date-fns";
import { toDecimal, type DecimalInput } from "./decimal";
import { formatCurrency } from "./format";

export type AlertTone = "success" | "warning" | "danger";

export interface Alert {
  id: string;
  tone: AlertTone;
  message: string;
}

export interface UpcomingPaymentInput {
  name: string;
  amount: DecimalInput;
  dueDate: Date;
}

export interface CategoryComparisonInput {
  categoryId: string;
  name: string;
  current: DecimalInput;
  previous: DecimalInput;
}

export interface PaceInput {
  onTrack: boolean;
  projectedOverage: DecimalInput;
}

export interface CalculateAlertsInput {
  today: Date;
  upcomingPayments: UpcomingPaymentInput[];
  categoryComparisons: CategoryComparisonInput[];
  pace: PaceInput;
  availableToSpend: DecimalInput;
}

const UPCOMING_PAYMENT_WINDOW_DAYS = 3;
const HIGH_SPEND_THRESHOLD_RATIO = 0.2;

/**
 * Genera las alertas inteligentes del dashboard a partir de datos ya
 * calculados (próximos pagos, comparación de categorías y ritmo de gasto).
 * No accede a la base de datos: solo compone mensajes legibles.
 */
export function calculateAlerts(input: CalculateAlertsInput): Alert[] {
  const currency = (value: DecimalInput) => formatCurrency(toDecimal(value).toNumber());

  const alerts: Alert[] = [];
  const today = startOfDay(input.today);

  if (toDecimal(input.availableToSpend).isNegative()) {
    alerts.push({
      id: "risk-negative-available",
      tone: "danger",
      message: `Ya comprometiste ${currency(toDecimal(input.availableToSpend).abs())} más de lo que tenés disponible. Evitá nuevos gastos.`,
    });
  }

  for (const payment of input.upcomingPayments) {
    const daysUntil = differenceInCalendarDays(startOfDay(payment.dueDate), today);
    if (daysUntil < 0 || daysUntil > UPCOMING_PAYMENT_WINDOW_DAYS) continue;

    const when = daysUntil === 0 ? "hoy" : daysUntil === 1 ? "mañana" : `en ${daysUntil} días`;
    alerts.push({
      id: `upcoming-${payment.name}-${payment.dueDate.toISOString()}`,
      tone: "warning",
      message: `El pago de "${payment.name}" de ${currency(payment.amount)} se cobrará ${when}.`,
    });
  }

  for (const comparison of input.categoryComparisons) {
    const previous = toDecimal(comparison.previous);
    const current = toDecimal(comparison.current);
    if (previous.lessThanOrEqualTo(0)) continue;

    const increaseRatio = current.minus(previous).dividedBy(previous);
    if (increaseRatio.greaterThanOrEqualTo(HIGH_SPEND_THRESHOLD_RATIO)) {
      const percent = increaseRatio.times(100).toDecimalPlaces(0).toNumber();
      alerts.push({
        id: `high-spend-${comparison.categoryId}`,
        tone: "warning",
        message: `Este mes gastaste ${percent}% más en ${comparison.name} que el mes anterior.`,
      });
    }
  }

  if (!input.pace.onTrack) {
    alerts.push({
      id: "pace-risk",
      tone: "danger",
      message: `Si mantenés tu ritmo actual, podrías quedarte ${currency(input.pace.projectedOverage)} por debajo del dinero necesario para cubrir tus próximos pagos.`,
    });
  } else {
    alerts.push({
      id: "pace-good",
      tone: "success",
      message: "Estás gastando menos de tu límite diario. Vas bien.",
    });
  }

  return alerts;
}
