type PersonCountSelectorProps = {
  value: number;
  minimum: number;
  maximum: number;
  onChange: (value: number) => void;
};

export default function PersonCountSelector({
  value,
  minimum,
  maximum,
  onChange,
}: PersonCountSelectorProps) {
  const update = (next: number) =>
    onChange(Math.min(maximum, Math.max(minimum, next)));

  return (
    <div className="mt-10 flex items-center justify-center gap-5">
      <button
        type="button"
        aria-label="Kişi sayısını azalt"
        disabled={value <= minimum}
        onClick={() => update(value - 1)}
        className="grid h-12 w-12 place-items-center rounded-full border text-2xl font-light disabled:cursor-not-allowed disabled:opacity-40"
      >
        −
      </button>
      <label className="sr-only" htmlFor="subscription-person-count">
        Kişi sayısı
      </label>
      <input
        id="subscription-person-count"
        type="number"
        min={minimum}
        max={maximum}
        value={value}
        onChange={(event) => update(Number(event.target.value) || minimum)}
        className="w-28 border-0 text-center text-5xl font-black outline-none"
      />
      <button
        type="button"
        aria-label="Kişi sayısını artır"
        disabled={value >= maximum}
        onClick={() => update(value + 1)}
        className="grid h-12 w-12 place-items-center rounded-full bg-slate-900 text-2xl font-light text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}
