/**
 * How Creatures arrive at the Christmas chalet: the shared limited-time rules
 * (`scenes/limited/arrivals.ts`) with the chalet's Advent calendar and artwork.
 */

import { limitedArrivals } from "../limited/arrivals";
import { CREATURE_ART } from "./artwork";
import { CHRISTMAS_CALENDAR } from "./calendar";

export const CHRISTMAS_ARRIVALS = limitedArrivals(
  "christmas",
  CHRISTMAS_CALENDAR,
  CREATURE_ART,
);
