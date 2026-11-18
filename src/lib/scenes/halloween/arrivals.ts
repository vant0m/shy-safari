/**
 * How Creatures arrive in Pumpkin Hollow: the shared limited-time rules
 * (`scenes/limited/arrivals.ts`) with the Hollow's calendar and artwork.
 */

import { limitedArrivals } from "../limited/arrivals";
import { CREATURE_ART } from "./artwork";
import { HALLOWEEN_CALENDAR } from "./calendar";

export const HALLOWEEN_ARRIVALS = limitedArrivals(
  "halloween",
  HALLOWEEN_CALENDAR,
  CREATURE_ART,
);
