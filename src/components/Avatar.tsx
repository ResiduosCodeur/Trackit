import Image from "next/image";

const COLORS = ["#7566f1", "#3b6fd8", "#2f8f6b", "#a35a3a", "#b04a8f", "#b9852b"];

function colorFor(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return COLORS[hash % COLORS.length];
}

export default function Avatar({
  name,
  seed,
  image,
  size = 40,
  className = "",
}: {
  name: string;
  /** Keeps a person's colour stable (their email works well) */
  seed?: string;
  image?: string | null;
  size?: number;
  className?: string;
}) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.42) };

  if (image) {
    return (
      <Image
        className={`shrink-0 rounded-full object-cover ${className}`}
        src={image}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        unoptimized
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${className}`}
      style={{ ...style, backgroundColor: colorFor(seed ?? name) }}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
