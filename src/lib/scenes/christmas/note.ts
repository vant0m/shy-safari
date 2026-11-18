/**
 * How a Note looks at the Christmas chalet: the reef's painted board in a
 * wooden frame, hung from the garland on red ribbons, with snow along its top
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
  // In the sky under the garland, between the chalet on the left and the
  // tree on the right, over the mountain.
  home: { x: 0.36, y: 0.2, width: 0.36, height: 0.28 },
};
