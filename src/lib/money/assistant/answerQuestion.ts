import type { FinancialSnapshot } from "./types";

export interface AssistantAnswer {
  intent: string;
  text: string;
}

const currency = (value: number) => value.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // saca tildes
    .toLowerCase()
    .trim();
}

function hasAny(text: string, words: string[]): boolean {
  return words.some((word) => text.includes(word));
}

/**
 * Asistente basado en reglas: no es IA generativa, es un enrutador de
 * palabras clave sobre los cálculos que la app ya hizo. Sin llamadas a
 * servicios externos, sin costo, siempre disponible.
 */
export function answerQuestion(question: string, snapshot: FinancialSnapshot): AssistantAnswer {
  const q = normalize(question);

  if (hasAny(q, ["hola", "buenas", "hey"])) {
    return {
      intent: "greeting",
      text: "¡Hola! Puedo contarte cuánto podés gastar hoy o esta semana, tus próximos pagos, cómo va el supermercado, o si hay alguna alerta. ¿Qué querés saber?",
    };
  }

  if (hasAny(q, ["semana"]) && hasAny(q, ["gastar", "disponible", "queda"])) {
    const tone = snapshot.weeklyRemaining < 0 ? "Ya te pasaste: " : "";
    return {
      intent: "weekly_available",
      text: `${tone}Esta semana tenés ${currency(snapshot.weeklyRemaining)} disponibles de un presupuesto semanal de ${currency(snapshot.weeklyBudget)}. Quedan ${snapshot.daysLeftInWeek} ${snapshot.daysLeftInWeek === 1 ? "día" : "días"}.`,
    };
  }

  if (hasAny(q, ["hoy"]) && hasAny(q, ["gastar", "puedo", "gasto"])) {
    return {
      intent: "daily_limit",
      text: `Podés gastar hasta ${currency(snapshot.dailyLimit)}/día para llegar bien a tu próximo sueldo (te quedan ${snapshot.daysRemaining} días del mes).`,
    };
  }

  if (hasAny(q, ["proximo pago", "proximos pago", "que pagos", "que debo pagar", "pagos pendientes"])) {
    if (snapshot.upcomingPayments.length === 0) {
      return { intent: "upcoming", text: "No tenés pagos pendientes este mes. 🎉" };
    }
    const dateFormatter = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" });
    const list = snapshot.upcomingPayments
      .slice(0, 5)
      .map((payment) => `${dateFormatter.format(payment.dueDate)}: ${payment.name} (${currency(payment.amount)})`)
      .join(", ");
    return { intent: "upcoming", text: `Tus próximos pagos son: ${list}.` };
  }

  if (hasAny(q, ["super", "supermercado"])) {
    if (snapshot.groceryRemaining === null) {
      return {
        intent: "grocery",
        text: "Todavía no configuraste un presupuesto de supermercado. Podés crearlo en Presupuestos.",
      };
    }
    return {
      intent: "grocery",
      text: `Te quedan ${currency(snapshot.groceryRemaining)} de presupuesto de supermercado para este mes.`,
    };
  }

  if (hasAny(q, ["reservado", "gastos fijos", "gasto fijo"])) {
    return {
      intent: "reserved",
      text: `Tenés ${currency(snapshot.reservedFixed)} reservados para gastos fijos que todavía no pagaste este mes.`,
    };
  }

  if (hasAny(q, ["alerta", "riesgo", "atencion"])) {
    if (snapshot.alerts.length === 0) {
      return { intent: "alerts", text: "No tenés alertas activas por ahora." };
    }
    return { intent: "alerts", text: snapshot.alerts.map((alert) => alert.message).join(" ") };
  }

  if (hasAny(q, ["ritmo"])) {
    return {
      intent: "pace",
      text: snapshot.onTrack
        ? `Vas bien: estás gastando ${currency(snapshot.averageDailySpend)}/día, dentro de lo que podés.`
        : `A tu ritmo actual (${currency(snapshot.averageDailySpend)}/día), te quedarías ${currency(snapshot.projectedOverage)} corto.`,
    };
  }

  if (hasAny(q, ["disponible", "cuanto tengo", "libre"])) {
    return {
      intent: "available",
      text: `Tenés ${currency(snapshot.available)} disponibles para gastar sin comprometer tus próximos pagos (de un saldo total de ${currency(snapshot.totalBalance)}).`,
    };
  }

  return {
    intent: "fallback",
    text: "No estoy seguro de cómo responder eso. Puedo ayudarte con: cuánto podés gastar hoy o esta semana, tu disponible, próximos pagos, el presupuesto de supermercado, gastos fijos reservados, alertas o tu ritmo de gasto.",
  };
}
