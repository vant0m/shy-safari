# Each Class keeps statistics, on this computer, for the teacher only

Teachers asked to see how their classes are doing over time: how much of a
lesson stayed under the goal, when in the day a class gets loud, and how two
classes compare. ADR 0001 rules out anything that makes noise more
interesting than quiet for the class, so statistics are **teacher-facing
only**: a panel behind a button, never on the Scene, never a score.

## What is recorded

Per Class and per local calendar day (`src/lib/stats/statsData.ts`), stored
under `class-noise-level:class:<id>:stats`:

- time judged Quiet and time judged Too Loud, only while a Session runs and
  the room is listened to (not while Paused, calibrating, or during the
  Timer's chime);
- Starts pressed, arrivals (and how many were Rare or Legendary), and
  Creatures that Ran Away;
- the noise level by ten-minute slot of the day, as one sample per second of
  listening, summed with a count.

The level is the meter's 0–100 scale, the one the Volume Goal is set on. It
is **not labelled decibels**: an uncalibrated laptop microphone behind
browser audio processing cannot give an honest dB figure, and the goal line
on the same scale is more useful anyway.

## How

- The loop reports each judged frame; frames longer than two seconds (a
  hidden tab, a sleeping laptop) are skipped, so gaps are not counted.
- Everything gathers in memory and is written every 30 seconds, when the tab
  is hidden or closed, and before the Class changes — never per frame.
- Days older than 180 are dropped as new days are written, which keeps a
  Class to a few hundred kilobytes at most. Statistics are part of an export.
- An import freezes the recorder first, so nothing from the current visit is
  written over the imported data.

## The panel

Eight tiles (quiet time, share of time under the goal, average level,
sessions, arrivals, ran away, rare, legendary), quiet minutes per day, the
average level through the day with the goal as a dashed line, and a table
comparing every Class over the same period. Each chart is one series in one
hue, drawn as SVG in the DOM, with a tooltip on every mark. A Class's
statistics can be cleared on their own, without touching its animals.
