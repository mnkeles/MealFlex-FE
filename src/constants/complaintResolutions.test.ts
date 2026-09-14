import { describe, expect, it } from "vitest";
import { complaintResolutionLabel } from "./complaintResolutions";

describe("complaintResolutionLabel", () => {
  it("müşteriye ham çözüm enumu yerine Türkçe etiketi gösterir", () => {
    expect(complaintResolutionLabel("NO_COMPENSATION")).toBe(
      "Telafisiz çözüm",
    );
    expect(complaintResolutionLabel("PARTIAL_REFUND")).toBe("Kısmi iade");
  });

  it("bilinmeyen yeni değerleri kaybetmez", () => {
    expect(complaintResolutionLabel("FUTURE_RESOLUTION")).toBe(
      "FUTURE_RESOLUTION",
    );
  });
});
