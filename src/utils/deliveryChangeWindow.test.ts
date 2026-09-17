import { describe, expect, it } from "vitest";
import {
  deliveryChangeDeadline,
  isDeliveryChangeWindowOpen,
} from "./deliveryChangeWindow";

describe("delivery change window", () => {
  it("uses the previous calendar day at the store's configured time", () => {
    expect(deliveryChangeDeadline("2026-09-18", "18:30").toISOString())
      .toBe("2026-09-17T15:30:00.000Z");
  });

  it("closes exactly at the previous day's cutoff time", () => {
    expect(isDeliveryChangeWindowOpen(
      "2026-09-18",
      "18:30",
      new Date("2026-09-17T15:29:59.999Z"),
    )).toBe(true);
    expect(isDeliveryChangeWindowOpen(
      "2026-09-18",
      "18:30",
      new Date("2026-09-17T15:30:00.000Z"),
    )).toBe(false);
  });
});
