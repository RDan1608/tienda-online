import { Blocks, Gem, KeyRound, Pin, Smartphone, Sparkles, ToyBrick } from "lucide-react";
import type { LucideProps } from "lucide-react";

const icons: Record<string, React.ComponentType<LucideProps>> = {
  joyeria: Gem,
  peluches: Sparkles,
  pines: Pin,
  llaveros: KeyRound,
  "phone-charms": Smartphone,
  legos: ToyBrick,
};

export function CategoryIcon({ slug, ...props }: { slug: string | null } & LucideProps) {
  const Icon = (slug && icons[slug]) || Blocks;
  return <Icon aria-hidden {...props} />;
}
