import { useState, useEffect, useMemo } from'react';
import type { BookToken } from'@/data/book-tokens';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Input } from'@/components/ui/input';
import { Label } from'@/components/ui/label';
import { Switch } from'@/components/ui/switch';
import { Button } from'@/components/ui/button';
import { Trash2, Plus, Copy } from'lucide-react';
import { tokensToRule, formatRule } from'@/lib/token-edit-rules';
import { toast } from'@/hooks/use-toast';

/** English label → Japanese POS tag stored on the token. */
const POS_OPTIONS: { label: string; value: string }[] = [
 { label:'Noun', value:'名詞'},
 { label:'Verb', value:'動詞'},
 { label:'Auxiliary verb (です/ます…)', value:'助動詞'},
 { label:'I-adjective', value:'形容詞'},
 { label:'Na-adjective', value:'形容動詞'},
 { label:'Adverb', value:'副詞'},
 { label:'Particle', value:'助詞'},
 { label:'Conjunction', value:'接続詞'},
 { label:'Interjection', value:'感動詞'},
 { label:'Pronoun', value:'代名詞'},
 { label:'Pre-noun adjectival (連体詞)', value:'連体詞'},
 { label:'Symbol / punctuation', value:'記号'},
 { label:'Counter (名詞/数)', value:'名詞/数'},
 { label:'Suffix (名詞/接尾)', value:'名詞/接尾'},
 { label:'Expression', value:'表現'},
];

function posLabel(value?: string): string {
 if (!value) return'';
 return POS_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

type PMode ='auto'|'omit'|'set';

export interface TokenDraft {
 t: string;
 r?: string;
 b?: string;
 /** When pMode ==='set', this is the chosen POS. Otherwise informational. */
 p?: string;
 pMode: PMode;
 j?: boolean;
 /** Original POS of the matched token at this index (for"auto"hint). */
 origP?: string;
}

function toDraft(tok: BookToken): TokenDraft {
 return {
 t: tok.t,
 r: tok.r,
 b: tok.b,
 p: tok.p,
 pMode:'auto',
 j: tok.j !== false,
 origP: tok.p,
 };
}

/** Convert a draft to the BookToken used to build the rule.
 * pMode ==='auto'→ p undefined (encoder omits POS, engine inherits original)
 * pMode ==='omit'→ p ==='-'sentinel (encoder emits alias`none`, engine clears POS so dictionary is unfiltered)
 * pMode ==='set'→ p === chosen POS
 */
function toToken(d: TokenDraft): BookToken {
 let p: string | undefined;
 if (d.pMode ==='set') p = d.p && d.p.trim() ? d.p : undefined;
 else if (d.pMode ==='omit') p ='-';
 const tok: BookToken = {
 t: d.t,
 j: d.j !== false,
 };
 if (p) tok.p = p;
 if (d.r) tok.r = d.r;
 if (d.b) tok.b = d.b;
 return tok;
}

interface Props {
 open: boolean;
 onClose: () => void;
 matched: BookToken[];
 isAdmin?: boolean;
 onSubmit: (replacement: BookToken[], opts: { global: boolean; shared: boolean }) => void;
}

export function TokenEditPanel({ open, onClose, matched, isAdmin = false, onSubmit }: Props) {
 const [drafts, setDrafts] = useState<TokenDraft[]>([]);
 const [globalScope, setGlobalScope] = useState(false);
 const [sharedScope, setSharedScope] = useState(false);

 useEffect(() => {
 if (open) {
 if (matched.length === 1) {
 setDrafts([toDraft(matched[0])]);
 } else {
 setDrafts([{
 t: matched.map((m) => m.t).join(''),
 r: matched.map((m) => m.r ??'').join('') || undefined,
 p: matched[0]?.p,
 pMode:'auto',
 j: true,
 origP: matched[0]?.p,
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
 const chars = [...cur.t];
 const mid = Math.max(1, Math.floor(chars.length / 2));
 const a = chars.slice(0, mid).join('');
 const b = chars.slice(mid).join('') || a;
 next.splice(i, 1, { ...cur, t: a, r: undefined, b: undefined }, { t: b, p: cur.p, pMode:'auto', j: true, origP: cur.origP });
 return next;
 });
 };

 const removeDraft = (i: number) => setDrafts((arr) => arr.filter((_, idx) => idx !== i));
 const addDraft = () => setDrafts((arr) => [...arr, { t:'', pMode:'auto', j: true }]);

 const valid = drafts.length > 0 && drafts.every((d) => d.t.trim().length > 0);

 // Live rule preview
 const previewRule = useMemo(() => {
 if (!valid || matched.length === 0) return null;
 return tokensToRule(matched, drafts.map(toToken));
 }, [drafts, matched, valid]);

 const previewStr = previewRule ? formatRule(previewRule) :'';

 const copyPreview = () => {
 if (!previewStr) return;
 navigator.clipboard.writeText(previewStr);
 toast({ title:'Copied', description:'Rule copied to clipboard.'});
 };

 return (
  <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
    <DrawerContent className="bg-card ring-1 ring-border/40 shadow-lg border-0">
      <div className="flex flex-col max-h-[85vh] overflow-y-auto px-5 pt-4 pb-6" onPointerDown={(e) => e.stopPropagation()}>
        <DrawerTitle className="text-left font-semibold text-lg mb-4">
          {matched.length === 1 ? `Edit token 「${matched[0].t}」` : `Merge ${matched.length} tokens`}
        </DrawerTitle>

 <div className="mt-2 mb-3 rounded-md bg-muted/50 px-3 py-2 text-xs">
 <span className="text-muted-foreground">Match: </span>
 <span className="font-japanese">{matched.map((m) => m.t).join('|')}</span>
 </div>

 <div className="space-y-4">
 {drafts.map((d, i) => (
 <div key={i} className="rounded-lg border p-3 space-y-2 bg-card">
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold text-muted-foreground">Output token {i + 1}</span>
 <div className="flex gap-1">
 <Button size="sm"variant="ghost"onClick={() => splitTokenAt(i)} title="Split this token">
 Split
 </Button>
 {drafts.length > 1 && (
 <Button size="sm"variant="ghost"onClick={() => removeDraft(i)} title="Remove">
 <Trash2 className="h-3.5 w-3.5"/>
 </Button>
 )}
 </div>
 </div>

 <div className="grid grid-cols-2 gap-2">
 <div>
 <Label className="text-[10px]">Surface (t)</Label>
 <Input value={d.t} onChange={(e) => updateDraft(i, { t: e.target.value })} className="font-japanese"/>
 </div>
 <div>
 <Label className="text-[10px]">Reading / furigana (r)</Label>
 <Input value={d.r ??''} onChange={(e) => updateDraft(i, { r: e.target.value || undefined })} className="font-japanese"placeholder="kana"/>
 </div>
 <div>
 <Label className="text-[10px]">Base / dico key (b)</Label>
 <Input value={d.b ??''} onChange={(e) => updateDraft(i, { b: e.target.value || undefined })} className="font-japanese"placeholder="optional"/>
 </div>
 <div>
 <Label className="text-[10px]">POS (p)</Label>
 <div className="flex gap-1">
 <select
 value={d.pMode}
 onChange={(e) => updateDraft(i, { pMode: e.target.value as PMode })}
 className="rounded-md border bg-background px-2 py-1.5 text-xs"
 title="POS handling"
 >
 <option value="auto">Keep original</option>
 <option value="omit">No filter (any POS)</option>
 <option value="set">Force POS…</option>
 </select>
 {d.pMode ==='set'&& (
 <select
 value={d.p ??'名詞'}
 onChange={(e) => updateDraft(i, { p: e.target.value })}
 className="flex-1 rounded-md border bg-background px-2 py-1.5 text-sm"
 >
 {POS_OPTIONS.map((o) => (
 <option key={o.value} value={o.value}>{o.label}</option>
 ))}
 {d.p && !POS_OPTIONS.some((o) => o.value === d.p) && (
 <option value={d.p}>{d.p}</option>
 )}
 </select>
 )}
 {d.pMode ==='auto'&& d.origP && (
 <span className="flex-1 truncate rounded-md bg-muted/60 px-2 py-1.5 text-xs text-muted-foreground"title="Inherited from original token">
 ↻ {posLabel(d.origP)}
 </span>
 )}
 {d.pMode ==='omit'&& (
 <span className="flex-1 rounded-md bg-muted/60 px-2 py-1.5 text-xs text-muted-foreground">
 dictionary will not filter by POS
 </span>
 )}
 </div>
 </div>
 </div>

 <label className="flex items-center justify-between rounded bg-muted/40 px-2 py-1.5">
 <span className="text-xs">Punctuation (j=false)</span>
 <Switch checked={d.j === false} onCheckedChange={(v) => updateDraft(i, { j: !v })} />
 </label>
 </div>
 ))}

 <Button variant="outline"size="sm"onClick={addDraft} className="w-full">
 <Plus className="mr-1 h-3.5 w-3.5"/> Add another output token
 </Button>
 </div>

 {/* Live preview */}
 <div className="mt-4 rounded-md border bg-muted/30 p-2">
 <div className="mb-1 flex items-center justify-between">
 <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Rule preview</span>
 <Button size="sm"variant="ghost"onClick={copyPreview} disabled={!previewStr} className="h-6 px-2">
 <Copy className="h-3 w-3"/>
 </Button>
 </div>
 <pre className="overflow-x-auto text-[11px] leading-relaxed">
 <code>{previewStr ||'// fill in the surface to preview'}</code>
 </pre>
 </div>

 <div className="sticky bottom-0 mt-4 space-y-2 bg-background pt-3">
 <label className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
 <div className="flex flex-col">
 <span className="text-xs font-semibold">Apply globally</span>
 <span className="text-[10px] text-muted-foreground">Use across all books (scope: *)</span>
 </div>
 <Switch checked={globalScope} onCheckedChange={setGlobalScope} />
 </label>
 {isAdmin && (
 <label className="flex items-center justify-between rounded-md border border-primary/40 bg-primary/5 px-3 py-2">
 <div className="flex flex-col">
 <span className="text-xs font-semibold text-primary">Publish for all accounts</span>
 <span className="text-[10px] text-muted-foreground">Admin: visible to every user</span>
 </div>
 <Switch checked={sharedScope} onCheckedChange={setSharedScope} />
 </label>
 )}
 <div className="flex gap-2">
 <Button variant="outline"onClick={onClose} className="flex-1">Cancel</Button>
 <Button
 disabled={!valid}
 onClick={() => onSubmit(drafts.map(toToken), { global: globalScope, shared: sharedScope })}
 className="flex-1"
 >
 Save rule
 </Button>
 </div>
 </div>
      </div>
    </DrawerContent>
    </Drawer>
 );
}
