import { ChevronRight, Sparkles } from 'lucide-react';
import { DelayedLink as Link } from '@/components/DelayedLink';
import { usePremium } from '@/hooks/use-premium';

/** Upsell card on the library home, only for signed-in users without an entitlement. */
export function PremiumCard() {
  const { isPremium, loading } = usePremium();

  if (loading || isPremium) return null;

  return (
    <section className="px-6 mb-8">
      <Link
        to="/premium"
        className="block relative overflow-hidden rounded-3xl border border-border/30 bg-card p-5 shadow-sm card-lift tap-scale"
        style={{
          backgroundImage:
            'linear-gradient(135deg, hsl(var(--accent) / 0.12) 0%, hsl(var(--card)) 60%)',
        }}
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/12 text-accent ring-1 ring-accent/20">
            <Sparkles className="h-6 w-6" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-lg font-bold">Unlock every chapter</h3>
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                Save 25%
              </span>
            </div>
            <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
              Full books, review mode, grammar notes, translations and audio
            </p>
          </div>

          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </div>
      </Link>
    </section>
  );
}
