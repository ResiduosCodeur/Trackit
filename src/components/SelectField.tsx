import { ChevronDownIcon } from "./icons";

/** Labelled <select> with our own chevron. */
export default function SelectField({
  label,
  value,
  onChange,
  disabled,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink/85">{label}</span>
      <span className="relative block">
        <select
          className="tk-input appearance-none !py-3 !pr-11"
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {children}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg text-ink/80" />
      </span>
    </label>
  );
}
