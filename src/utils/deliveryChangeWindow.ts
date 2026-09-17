const DEFAULT_CHANGE_CUTOFF_TIME = "17:00";
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * Turkey has a fixed UTC+03:00 offset. The deadline is the configured time
 * on the calendar day before the delivery, not a rolling 24-hour period.
 */
export function deliveryChangeDeadline(
  deliveryDate: string,
  cutoffTime?: string,
) {
  const normalizedTime = (cutoffTime || DEFAULT_CHANGE_CUTOFF_TIME).slice(0, 5);
  const deliveryDayAtCutoff = new Date(
    `${deliveryDate}T${normalizedTime}:00+03:00`,
  );
  return new Date(deliveryDayAtCutoff.getTime() - ONE_DAY_IN_MS);
}

export function isDeliveryChangeWindowOpen(
  deliveryDate: string,
  cutoffTime?: string,
  now = new Date(),
) {
  return now.getTime() < deliveryChangeDeadline(deliveryDate, cutoffTime).getTime();
}

export function deliveryChangeCutoffLabel(cutoffTime?: string) {
  return (cutoffTime || DEFAULT_CHANGE_CUTOFF_TIME).slice(0, 5);
}
