/**
 * Retorna a data de hoje no timezone America/Bahia no formato YYYY-MM-DD.
 */
export function getTodayBahia(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Bahia",
  });
}
