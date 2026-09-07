import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DeliverySlotRangePicker from "./DeliverySlotRangePicker";

describe("DeliverySlotRangePicker", () => {
  it("günün tamamını 15 dakikalık 96 seçenek olarak sunar", () => {
    render(<DeliverySlotRangePicker value={[]} onChange={vi.fn()} />);
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(192);
    expect(options[0]).toHaveTextContent("00:00");
    expect(options[95]).toHaveTextContent("23:45");
  });

  it("seçilen aralığı uçları dahil ekler ve tekrarları ayıklar", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DeliverySlotRangePicker value={["12:15"]} onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText("Başlangıç saati"), "12:00");
    await user.selectOptions(screen.getByLabelText("Bitiş saati"), "12:30");
    await user.click(screen.getByRole("button", { name: "Aralığı ekle" }));

    expect(onChange).toHaveBeenCalledWith(["12:00", "12:15", "12:30"]);
  });

  it("ters aralığı eklemez ve anlaşılır hata gösterir", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<DeliverySlotRangePicker value={[]} onChange={onChange} />);
    await user.selectOptions(screen.getByLabelText("Başlangıç saati"), "14:00");
    await user.selectOptions(screen.getByLabelText("Bitiş saati"), "12:00");
    await user.click(screen.getByRole("button", { name: "Aralığı ekle" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Bitiş saati başlangıç saatinden önce olamaz.");
    expect(onChange).not.toHaveBeenCalled();
  });
});
