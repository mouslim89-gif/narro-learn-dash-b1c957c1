import { Sparkles } from 'lucide-react';
import { DelayedLink as Link } from '@/components/DelayedLink';
import { usePremium } from '@/hooks/use-premium';

export function PremiumUpsellCard() {
  const { isPremium, loading } = usePremium();

  if (loading || isPremium) return null;

  return (
    <section className="px-6 py-5 border-t border-border/40">
      <Link
        to="/premium"
        className="block relative overflow-hidden rounded-3xl border border-accent/25 bg-card p-5 shadow-sm card-lift tap-scale"
        style={{
          backgroundImage:
            'linear-gradient(135deg, hsl(var(--accent) / 0.16) 0%, hsl(var(--card)) 62%)',
        }}
      >
        <span className="library-kanji-watermark" aria-hidden>
          読
        </span>
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent ring-1 ring-accent/25">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Tsundoku Premium
            </p>
            <h3 className="mt-1 font-serif text-lg font-bold leading-tight">
              Unlock the full library
            </h3>
            <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
              Every chapter, review mode, grammar notes, translations and audio.
            </p>
          </div>
        </div>
      </Link>
    </section>
  );
}
