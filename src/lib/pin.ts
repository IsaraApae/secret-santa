/**
 * How many tries a name's PIN gets. A 4-digit PIN has 10,000 values, so the hourly limit alone would
 * let someone with the group's link try them all in under two months, well inside a group's 180 days.
 * The second limit counts tries without a right one over thirty days: at 30, working through every
 * PIN would take decades. A right PIN, or the organiser resetting it, starts both counts again.
 */
export const PIN_TRIES = { hour: 8, month: 30 };
export const HOUR = 60 * 60;
export const MONTH = HOUR * 24 * 30;

/**
 * Whether this try may go ahead, from how many there have been (this one included) in the hour and in
 * the thirty days. "too_many" passes by itself within the hour; "locked" is for the organiser to lift.
 */
export function pinLock(inHour: number, inMonth: number): "locked" | "too_many" | null {
  if (inMonth > PIN_TRIES.month) return "locked";
  if (inHour > PIN_TRIES.hour) return "too_many";
  return null;
}
