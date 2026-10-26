import { icons, type LucideProps } from "lucide-react";

// "circle-dollar-sign" -> "CircleDollarSign"
export const toPascal = (s: string) =>
  s
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");

export const iconExists = (name: string) => toPascal(name) in icons;

export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const Cmp = icons[toPascal(name) as keyof typeof icons] ?? icons.CircleHelp;
  return <Cmp aria-hidden="true" {...props} />;
}
