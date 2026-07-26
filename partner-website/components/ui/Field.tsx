import { hintClass, labelClass } from "./styles";

export function Field({
  label,
  htmlFor,
  hint,
  className = "",
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {hint ? <p className={hintClass}>{hint}</p> : null}
      {children}
    </div>
  );
}
