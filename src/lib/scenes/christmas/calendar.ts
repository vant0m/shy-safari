/**
 * The Christmas chalet's dates: open from the first day of Advent with its
 * whole Roster, counting down after Christmas until the first full week of
 * January, then closed. The rules are shared by every limited-time Scene
 * (`scenes/limited/calendar.ts`).
 *
 * Bringing it back another year is a matter of the dates below.
 */

import type { LimitedCalendar } from "../limited/calendar";

export const CHRISTMAS_CALENDAR: LimitedCalendar = {
  /** The first day of Advent. */
  opens: "2026-12-01",
  /** Christmas Day: the last day before the countdown. */
  peak: "2026-12-25",
  /** The last day the chalet is open. It is gone the day after. */
  lastDay: "2027-01-08",
};
