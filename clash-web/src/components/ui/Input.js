"use client";
import { useState } from "react";

export default function Input({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  maxLength,
  multiline = false,
  error,
  className = "",
}) {
  const [focused, setFocused] = useState(false);

  const inputClass = `w-full bg-[var(--surface)] border rounded-[var(--radius)] px-4 text-[var(--text)] placeholder:text-[var(--muted)] outline-none transition-colors ${
    error
      ? "border-accent"
      : focused
      ? "border-[var(--text)]"
      : "border-[var(--border)]"
  } ${multiline ? "py-3 min-h-[100px] resize-none" : "h-12"}`;

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-[11px] font-semibold tracking-wider uppercase text-[var(--muted)] mb-1.5">
          {label}
        </label>
      )}
      {multiline ? (
        <textarea
          className={inputClass}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      ) : (
        <input
          type={type}
          className={inputClass}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      )}
      {error && <p className="text-accent text-xs mt-1">{error}</p>}
      {maxLength && value && (
        <p className="text-[var(--muted)] text-xs text-right mt-1">
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  );
}
