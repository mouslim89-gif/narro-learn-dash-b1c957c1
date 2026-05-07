import { useState, useEffect } from 'react';
import type { BookToken } from '@/data/book-tokens';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Trash2, Plus } from 'lucide-react';

const POS_OPTIONS = [
  '名詞', '動詞', '形容詞', '副詞', '助詞', '助動詞',
  '接続詞', '感動詞', '代名詞', '連体詞', '記号', '名詞/数', '名詞/接尾',
];

export interface TokenDraft {
  t: string;
  r?: string;
  b?: string;
  p?: string;
  j?: boolean;
}

function toDraft(tok: BookToken): TokenDraft {
  return { t: tok.t, r: tok.r, b: tok.b, p: tok.p, j: tok.j !== false };
}

function toToken(d: TokenDraft): BookToken {
  return {
    t: d.t,
    j: d.j !== false,
    p: d.p ?? (d.j === false ? '記号' : '名詞'),
    ...(d.r ? { r: d.r } : {}),
    ...(d.b ? { b: d.b } : {}),
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Tokens currently selected from the text (1 = edit; >1 = merge). */
  matched: BookToken[];
  /** Submit replacement tokens (the new rule) — caller persists. */
  onSubmit: (replacement: BookToken[]) => void;
}

export function TokenEditPanel({ open, onClose, matched, onSubmit }: Props) {
  const [drafts, setDrafts] = useState<TokenDraft[]>([]);

  useEffect(() => {
    if (open) {
      // Default replacement = 1 token that joins all matched surfaces.
      if (matched.length === 1) {
        setDrafts([toDraft(matched[0])]);
      } else {
        setDrafts([{
          t: matched.map((m) => m.t).join(''),
          r: matched.map((m) => m.r ?? '').join('') || undefined,
          p: matched[0]?.p ?? '名詞',
          j: true,
        }]);
      }
    }
  }, [open, matched]);

  const updateDraft = (i: number, patch: Partial<TokenDraft>) => {
    setDrafts((arr) => arr.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  };

  const splitTokenAt = (i: number) => {
    setDrafts((arr) => {
      const next = [...arr];
      const cur = next[i];
      // Split surface in half by chars
      const chars = [...cur.t];
      const mid = Math.max(1, Math.floor(chars.length / 2));
      const a = chars.slice(0, mid).join('');
      const b = chars.slice(mid).join('') || a;
      next.splice(i, 1, { ...cur, t: a, r: undefined, b: undefined }, { t: b, p: cur.p, j: true });
      return next;
    });
  };

  const removeDraft = (i: number) => setDrafts((arr) => arr.filter((_, idx) => idx !== i));
  const addDraft = () => setDrafts((arr) => [...arr, { t: '', p: '名詞', j: true }]);

  const valid = drafts.length > 0 && drafts.every((d) => d.t.trim().length > 0);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {matched.length === 1 ? `Edit token  「${matched[0].t}」` : `Merge ${matched.length} tokens`}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-2 mb-3 rounded-md bg-muted/50 px-3 py-2 text-xs">
          <span className="text-muted-foreground">Match: </span>
          <span className="font-japanese">{matched.map((m) => m.t).join(' | ')}</span>
        </div>

        <div className="space-y-4">
          {drafts.map((d, i) => (
            <div key={i} className="rounded-lg border p-3 space-y-2 bg-card">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Output token {i + 1}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => splitTokenAt(i)} title="Split this token">
                    Split
                  </Button>
                  {drafts.length > 1 && (
                    <Button size="sm" variant="ghost" onClick={() => removeDraft(i)} title="Remove">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px]">Surface (t)</Label>
                  <Input value={d.t} onChange={(e) => updateDraft(i, { t: e.target.value })} className="font-japanese" />
                </div>
                <div>
                  <Label className="text-[10px]">Reading / furigana (r)</Label>
                  <Input value={d.r ?? ''} onChange={(e) => updateDraft(i, { r: e.target.value || undefined })} className="font-japanese" placeholder="kana" />
                </div>
                <div>
                  <Label className="text-[10px]">Base / dico key (b)</Label>
                  <Input value={d.b ?? ''} onChange={(e) => updateDraft(i, { b: e.target.value || undefined })} className="font-japanese" placeholder="optional" />
                </div>
                <div>
                  <Label className="text-[10px]">POS (p)</Label>
                  <select
                    value={d.p ?? '名詞'}
                    onChange={(e) => updateDraft(i, { p: e.target.value })}
                    className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                  >
                    {POS_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                    {d.p && !POS_OPTIONS.includes(d.p) && <option value={d.p}>{d.p}</option>}
                  </select>
                </div>
              </div>

              <label className="flex items-center justify-between rounded bg-muted/40 px-2 py-1.5">
                <span className="text-xs">Punctuation (j=false)</span>
                <Switch checked={d.j === false} onCheckedChange={(v) => updateDraft(i, { j: !v })} />
              </label>
            </div>
          ))}

          <Button variant="outline" size="sm" onClick={addDraft} className="w-full">
            <Plus className="mr-1 h-3.5 w-3.5" /> Add another output token
          </Button>
        </div>

        <div className="sticky bottom-0 mt-4 flex gap-2 bg-background pt-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            disabled={!valid}
            onClick={() => onSubmit(drafts.map(toToken))}
            className="flex-1"
          >
            Save rule
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
