import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LegalPageProps {
  title: string;
  metaTitle: string;
  metaDescription: string;
  canonicalPath: string;
  lastUpdated: string;
  eyebrow?: string;
  children: ReactNode;
}

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function LegalPage({
  title,
  metaTitle,
  metaDescription,
  canonicalPath,
  lastUpdated,
  eyebrow = 'Legal',
  children,
}: LegalPageProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const prevTitle = document.title;
    document.title = metaTitle;
    setMeta('description', metaDescription);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const created = !canonical;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    const prevHref = canonical.href;
    canonical.href = `${window.location.origin}${canonicalPath}`;

    return () => {
      document.title = prevTitle;
      if (created) canonical?.remove();
      else if (canonical) canonical.href = prevHref;
    };
  }, [metaTitle, metaDescription, canonicalPath]);

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/50 bg-background/80 px-6 pb-3 pt-3 backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          aria-label="Back"
          className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-md ring-1 ring-border/40 shrink-0 header-chip"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider leading-none text-muted-foreground">{eyebrow}</p>
          <p className="mt-0.5 truncate font-serif text-base font-bold">{title}</p>
        </div>
      </header>

      <main className="stagger-children px-6 pt-6">
        <h1 className="font-serif text-[28px] font-bold leading-tight">{title}</h1>
        <p className="mt-1 text-xs text-muted-foreground">Last updated: {lastUpdated}</p>

        <div className="legal-prose mt-6 space-y-6 pb-8">{children}</div>
      </main>
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-card p-5 ring-1 ring-border/30 shadow-sm">
      <h2 className="font-serif text-lg font-semibold">{heading}</h2>
      <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-foreground/85">{children}</div>
    </section>
  );
}
