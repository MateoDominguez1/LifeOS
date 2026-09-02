export function formatCurrency(value: number): string {
  return value.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}
