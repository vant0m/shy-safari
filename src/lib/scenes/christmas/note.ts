/**
 * How a Note looks at the Christmas chalet: the reef's painted board in a
 * wooden frame, hung from above on red ribbons, with snow along its top
 * and a sprig of holly on its corner (`christmas/NoteArt.svelte`).
 */

import type { NoteLook } from "../index";
import { PEN_COLOURS, rectOf, signShape } from "../noteArt";
import NoteArt from "./NoteArt.svelte";

export const CHRISTMAS_NOTE: NoteLook = {
  Art: NoteArt,
  writing: (width, height) => signShape(width, height).writing,
  // The painted board; the wooden frame round it is the border.
  surface: (width, height) => rectOf(signShape(width, height).panel),
  inks: { dark: "#4a2c17", ...PEN_COLOURS },
  // In the night sky over the valley, under the northern lights and above
  // the chalets and the fir trees at either side.
  home: { x: 0.31, y: 0.1, width: 0.38, height: 0.3 },
};
