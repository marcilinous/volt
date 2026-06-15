"use client";

export default function Button({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  loading = false,
  className = "",
  type = "button",
}) {
  const base =
    "h-[52px] px-6 font-semibold text-xs tracking-widest uppercase rounded-[var(--radius)] transition-all duration-150 flex items-center justify-center gap-2 w-full disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer";

  const variants = {
    primary: "bg-accent text-white hover:opacity-90",
    outline:
      "bg-transparent border border-[var(--border)] text-[var(--text)] hover:border-[var(--muted)]",
    ghost: "bg-transparent text-accent hover:opacity-80",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {loading ? (
        <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  );
}
