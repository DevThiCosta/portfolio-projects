/**
 * O app roda na nuvem (provavelmente em UTC), mas o bar é no Brasil.
 * Horário de Brasília é UTC-3 fixo — o Brasil aboliu horário de verão em
 * 2019 — então um offset fixo é suficiente, sem precisar de biblioteca de
 * fuso horário.
 */
const BR_OFFSET_MS = 3 * 60 * 60 * 1000;

export const BR_TIME_ZONE = "America/Sao_Paulo";

function brazilDateParts(date: Date) {
  const shifted = new Date(date.getTime() - BR_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth(),
    date: shifted.getUTCDate(),
    day: shifted.getUTCDay(),
  };
}

function brazilMidnightUTC(year: number, month: number, date: number): Date {
  return new Date(Date.UTC(year, month, date, 0, 0, 0) + BR_OFFSET_MS);
}

/** Meia-noite de hoje em Brasília, como instante UTC. */
export function brazilDayStart(now = new Date()): Date {
  const { year, month, date } = brazilDateParts(now);
  return brazilMidnightUTC(year, month, date);
}

/** Meia-noite da segunda-feira desta semana em Brasília. */
export function brazilWeekStart(now = new Date()): Date {
  const { year, month, date, day } = brazilDateParts(now);
  const diffToMonday = day === 0 ? 6 : day - 1;
  return brazilMidnightUTC(year, month, date - diffToMonday);
}

/** Meia-noite do dia 1 deste mês em Brasília. */
export function brazilMonthStart(now = new Date()): Date {
  const { year, month } = brazilDateParts(now);
  return brazilMidnightUTC(year, month, 1);
}

/** Instante a partir do qual um registro criado antes dele é considerado "antigo demais". */
export function olderThan(thresholdMs: number): Date {
  return new Date(Date.now() - thresholdMs);
}

/** Soma (ou subtrai, com `months` negativo) meses a uma data, preservando o dia e horário. */
export function addCalendarMonthsBrazil(date: Date, months: number): Date {
  const { year, month, date: day } = brazilDateParts(date);
  const target = new Date(date.getTime());
  target.setUTCFullYear(year, month + months, day);
  return target;
}

/** Converte o valor de um <input type="date"> ("YYYY-MM-DD") pra meia-noite em Brasília. */
export function brazilDateFromLabel(label: string): Date {
  const [year, month, date] = label.split("-").map(Number);
  return brazilMidnightUTC(year, month - 1, date);
}

/** Converte o valor de um <input type="month"> ("YYYY-MM") pro dia 1, meia-noite em Brasília. */
export function brazilMonthStartFromLabel(label: string): Date {
  return brazilDateFromLabel(`${label}-01`);
}
