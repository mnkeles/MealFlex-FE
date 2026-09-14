import { describe, expect, it } from "vitest";
import { adminActionLabel } from "./adminLabels";

describe("adminActionLabel", () => {
  it("shows common audit actions with readable Turkish labels", () => {
    expect(adminActionLabel("DELIVERY_SKIPPED")).toBe("Teslimat atlandı");
    expect(adminActionLabel("REFUND_SUCCEEDED")).toBe("İade başarılı");
    expect(adminActionLabel("SUBSCRIPTION_APPROVED")).toBe("Abonelik onaylandı");
  });

  it("does not corrupt the letter i in unknown technical action codes", () => {
    expect(adminActionLabel("IDENTITY_VERIFIED")).toBe("Identity Verified");
  });
});
