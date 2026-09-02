"use client";

import { useState } from "react";
import { Sparkles, Send } from "lucide-react";
import { Card, CardLabel } from "@/components/ui/card";
import { answerQuestion } from "@/lib/money/assistant/answerQuestion";
import type { FinancialSnapshot } from "@/lib/money/assistant/types";

const SUGGESTIONS = [
  "¿Cuánto puedo gastar hoy?",
  "¿Cuánto puedo gastar esta semana?",
  "¿Cuáles son mis próximos pagos?",
  "¿Cómo voy con el supermercado?",
];

type Message = { from: "user" | "assistant"; text: string };

export function AssistantPanel({ snapshot }: { snapshot: FinancialSnapshot }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      from: "assistant",
      text: "Hola, soy tu asistente de Money. Preguntame lo que quieras sobre tus números — no uso IA externa, solo miro los cálculos que ya hizo la app.",
    },
  ]);
  const [input, setInput] = useState("");

  function ask(question: string) {
    const trimmed = question.trim();
    if (!trimmed) return;
    const answer = answerQuestion(trimmed, snapshot);
    setMessages((prev) => [...prev, { from: "user", text: trimmed }, { from: "assistant", text: answer.text }]);
    setInput("");
  }

  return (
    <Card>
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-accent-ink" />
        <CardLabel>Asistente</CardLabel>
      </div>

      <div className="mt-3 flex max-h-72 flex-col gap-2 overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
              message.from === "user" ? "ml-auto bg-accent text-white" : "bg-surface-raised text-ink"
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => ask(suggestion)}
            className="rounded-full border border-border px-2.5 py-1 text-xs text-ink-soft hover:border-accent hover:text-accent-ink"
          >
            {suggestion}
          </button>
        ))}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          ask(input);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Preguntame algo…"
          className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-base outline-none focus:border-accent md:text-sm"
        />
        <button
          type="submit"
          aria-label="Enviar"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-white"
        >
          <Send size={15} />
        </button>
      </form>
    </Card>
  );
}
