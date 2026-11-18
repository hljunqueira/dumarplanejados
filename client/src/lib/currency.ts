/**
 * Utilitários padronizados para manipulação e formatação monetária (Real Brasileiro - BRL)
 * Ecossistema Dumar Móveis Planejados
 */

export function parseMonetaryInput(val: string | number | undefined | null): number {
  if (val === undefined || val === null || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : parseFloat(val.toFixed(2));
  
  let clean = val.toString().replace(/R\$\s?/, "").trim();
  if (clean.includes(",") && clean.includes(".")) {
    clean = clean.replace(/\./g, "").replace(",", ".");
  } else if (clean.includes(",")) {
    clean = clean.replace(",", ".");
  }
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parseFloat(parsed.toFixed(2));
}

export function formatBRL(value: number | string | undefined | null): string {
  const num = typeof value === "number" ? value : parseMonetaryInput(value);
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
