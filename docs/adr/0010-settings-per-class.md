# Each Class keeps its own Volume Goal, Arrival Rate, Too Loud choice and Scene

Supersedes the "Shared" half of
[0004-classes-keep-their-own-animals](0004-classes-keep-their-own-animals.md).

0004 kept every setting shared, on the grounds that settings describe the
room. In practice a teacher who sees several groups in one room tunes them
differently: a year-9 science class doing group work wants Partner work and
a Lively rate; the year-7 class after it, doing silent reading, wants Silent
and Relaxed, and maybe the reef rather than deep space. Re-tuning at every
bell is exactly the chore Classes were meant to remove.

## What belongs where

- **Per Class:** the Volume Goal (preset and value), the Arrival Rate (preset
  and minutes), what Too Loud does (run away or pause), and the Scene the
  Class was last on. Stored under the Class's prefix as
  `class-noise-level:class:<id>:settings`, so deleting a Class deletes them
  with everything else it kept.
- **Room:** the microphone, its calibration, and whether the Noise Meter and
  arrival counter stay up on screen. These describe the hardware and the
  teacher's screen, not the students; recalibrating per class would be
  absurd. Still stored at `class-noise-level:settings`.
- The language stays its own setting, as before.

## Migration

Nothing resets on update. The room record (`class-noise-level:settings`)
used to hold every setting; it is left in place, and a Class with no
settings of its own reads its half from it. The first change a Class makes
writes its own record. A newly added Class starts with a copy of the
settings of the Class on screen, which is almost always what the teacher
wants.

## Switching

Switching Class reloads its settings and switches to its Scene (falling back
to the default if that Scene is no longer on offer, as a Limited-time Scene
may not be), then waits for Start as before.
