/**
 * Pumpkin Hollow's dates: open for the weeks round Halloween with its whole
 * Roster, counting down for a week after it, then closed. The rules are
 * shared by every limited-time Scene (`scenes/limited/calendar.ts`).
 *
 * Bringing the Hollow back another year is a matter of the dates below.
 */

import type { LimitedCalendar } from "../limited/calendar";

export const HALLOWEEN_CALENDAR: LimitedCalendar = {
  /** The first day the Hollow is open. */
  opens: "2026-10-18",
  /** Halloween itself: the last day before the countdown. */
  peak: "2026-10-31",
  /** The last day the Hollow is open. It is gone the day after. */
  lastDay: "2026-11-07",
};
