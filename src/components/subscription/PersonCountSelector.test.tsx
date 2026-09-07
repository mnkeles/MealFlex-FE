import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import PersonCountSelector from "./PersonCountSelector";

describe("PersonCountSelector", () => {
  it("artırma ve azaltmayı mağazanın sınırları içinde tutar", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <PersonCountSelector value={3} minimum={3} maximum={4} onChange={onChange} />,
    );

    expect(screen.getByRole("button", { name: "Kişi sayısını azalt" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Kişi sayısını artır" }));
    expect(onChange).toHaveBeenLastCalledWith(4);

    rerender(
      <PersonCountSelector value={4} minimum={3} maximum={4} onChange={onChange} />,
    );
    expect(screen.getByRole("button", { name: "Kişi sayısını artır" })).toBeDisabled();
  });

  it("elle girilen değeri de izin verilen aralığa sınırlar", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <PersonCountSelector value={5} minimum={3} maximum={10} onChange={onChange} />,
    );

    const input = screen.getByRole("spinbutton", { name: "Kişi sayısı" });
    await user.clear(input);
    await user.type(input, "99");
    expect(onChange).toHaveBeenLastCalledWith(10);
  });
});
