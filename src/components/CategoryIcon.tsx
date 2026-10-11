import Image from "next/image";

/** The single icon every expense uses (a glowing cash note). */
export function ExpenseIcon({ size = 44 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0d0f1f] ring-1 ring-accent-strong/30"
      style={{ width: size, height: size }}
    >
      <Image
        alt=""
        className="scale-[0.9]"
        height={size}
        src="/images/cash-icon.png"
        style={{ width: size, height: size }}
        unoptimized
        width={size}
      />
    </span>
  );
}

/** The single icon every group uses (a glowing purple group). */
export function GroupIcon({ size = 56 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0d0f1f] ring-1 ring-accent-strong/30"
      style={{ width: size, height: size }}
    >
      <Image
        alt=""
        className="scale-[0.92]"
        height={size}
        src="/images/group-icon.png"
        style={{ width: size, height: size }}
        unoptimized
        width={size}
      />
    </span>
  );
}

/** Icon for settled-up payments (a glowing handshake). */
export function SettleIcon({ size = 44 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0d0f1f] ring-1 ring-accent-strong/30"
      style={{ width: size, height: size }}
    >
      <Image
        alt=""
        className="scale-[0.9]"
        height={size}
        src="/images/settle-icon.png"
        style={{ width: size, height: size }}
        unoptimized
        width={size}
      />
    </span>
  );
}