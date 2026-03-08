/**
 * Retorna a data de hoje no timezone America/Bahia no formato YYYY-MM-DD.
 */
export function getTodayBahia(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Bahia",
  });
}

/**
 * Retorna o dia da semana atual no timezone America/Bahia.
 * 0 = Domingo, 6 = Sábado
 */
export function getWeekdayBahia(): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bahia",
    weekday: "short",
  }).format(new Date());

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return weekdayMap[weekday] ?? new Date().getDay();
}
