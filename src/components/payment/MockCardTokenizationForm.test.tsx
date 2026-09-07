import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MockCardTokenizationForm from "./MockCardTokenizationForm";
import { paymentService } from "@/services/paymentService";

vi.mock("@/services/paymentService", () => ({
  paymentService: { addMethod: vi.fn() },
}));

const savedMethod = {
  id: 9,
  provider: "MOCK",
  brand: "Visa",
  lastFour: "4242",
  expiryMonth: 12,
  expiryYear: 2099,
  defaultMethod: true,
};

describe("MockCardTokenizationForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("geçersiz kart numarasını API çağırmadan açıklar", async () => {
    const user = userEvent.setup();
    render(<MockCardTokenizationForm onAdded={vi.fn()} />);

    await user.type(screen.getByLabelText("Kart üzerindeki ad"), "Ayşe Demir");
    await user.type(screen.getByLabelText("Kart numarası"), "424242424242424");
    await user.type(screen.getByLabelText("Son kullanma tarihi"), "1299");
    await user.type(screen.getByLabelText("CVV güvenlik kodu"), "123");
    await user.click(screen.getByRole("button", { name: "Kartı güvenli ekle" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Kart numarası 16 rakam olmalıdır.",
    );
    expect(paymentService.addMethod).not.toHaveBeenCalled();
  });

  it("geçerli kartı yalnız token ve maskeli bilgilerle kaydeder", async () => {
    const user = userEvent.setup();
    const onAdded = vi.fn();
    vi.mocked(paymentService.addMethod).mockResolvedValue(savedMethod);
    render(<MockCardTokenizationForm onAdded={onAdded} />);

    await user.type(screen.getByLabelText("Kart üzerindeki ad"), "Ayşe Demir");
    await user.type(screen.getByLabelText("Kart numarası"), "4242424242424242");
    await user.type(screen.getByLabelText("Son kullanma tarihi"), "1299");
    await user.type(screen.getByLabelText("CVV güvenlik kodu"), "123");
    await user.click(screen.getByRole("button", { name: "Kartı güvenli ekle" }));

    await waitFor(() => expect(onAdded).toHaveBeenCalledWith(savedMethod));
    expect(paymentService.addMethod).toHaveBeenCalledWith(
      expect.objectContaining({
        cardHolderName: "Ayşe Demir",
        brand: "Visa",
        lastFour: "4242",
        expiryMonth: 12,
        expiryYear: 2099,
      }),
    );
    const payload = vi.mocked(paymentService.addMethod).mock.calls[0][0];
    expect(payload.providerToken).toMatch(/^tok_/);
    expect(JSON.stringify(payload)).not.toContain("4242424242424242");
    expect(JSON.stringify(payload)).not.toContain("123");
  });
});
