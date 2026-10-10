"use client";

import { useState } from "react";

import { EyeIcon, EyeOffIcon } from "@/components/icons";

export default function PasswordField({
  label,
  placeholder,
  value,
  onChange,
  disabled,
  autoComplete,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium text-ink/85">{label}</span>
      <span className="relative block">
        <input
          className="tk-input !py-3 !pr-12"
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-muted transition-colors hover:text-ink"
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeIcon /> : <EyeOffIcon />}
        </button>
      </span>
    </label>
  );
}
