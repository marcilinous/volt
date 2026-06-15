"use client";

export default function ChipSelector({
  label,
  options,
  selected,
  onToggle,
  multi = true,
}) {
  const handleClick = (key) => {
    if (multi) {
      const arr = Array.isArray(selected) ? selected : [];
      onToggle(
        arr.includes(key) ? arr.filter((s) => s !== key) : [...arr, key]
      );
    } else {
      onToggle(selected === key ? "" : key);
    }
  };

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-[11px] font-semibold tracking-wider uppercase text-[var(--muted)] mb-2.5">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const key = typeof opt === "string" ? opt : opt.key;
          const label = typeof opt === "string" ? opt : opt.label;
          const isSelected = multi
            ? (Array.isArray(selected) ? selected : []).includes(key)
            : selected === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleClick(key)}
              className={`px-3.5 py-2 rounded-[var(--radius)] border text-sm font-medium transition-all cursor-pointer ${
                isSelected
                  ? "border-accent bg-accent/8 text-accent"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--muted)]"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
