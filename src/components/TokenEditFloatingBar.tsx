import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTokenEditStore } from '@/stores/token-edit';
import { formatRulesBlock } from '@/lib/token-edit-rules';
import { tokenOverrides } from '@/data/token-overrides';
import { toast } from '@/hooks/use-toast';
import { Copy, Trash2, X } from 'lucide-react';

interface Props {
  bookId: string;
  /** Number of tokens currently selected (for the merge button). */
  selectionCount: number;
  onMerge: () => void;
  onClearSelection: () => void;
  onExitEditMode: () => void;
}

export function TokenEditFloatingBar({ bookId, selectionCount, onMerge, onClearSelection, onExitEditMode }: Props) {
  const { buffers, clear } = useTokenEditStore();
  const [scope, setScope] = useState<string>(bookId);
  const [showRules, setShowRules] = useState(false);

  const bookBuf = buffers[bookId] ?? [];
  const globalBuf = buffers['*'] ?? [];
  const total = bookBuf.length + globalBuf.length;

  const activeBuf = scope === '*' ? globalBuf : bookBuf;
  const baseRules = scope === '*' ? (tokenOverrides['*'] ?? []) : (tokenOverrides[scope] ?? []);
  const merged = [...baseRules, ...activeBuf];
  const block = formatRulesBlock(merged, scope);

  const copy = () => {
    navigator.clipboard.writeText(block);
    toast({ title: 'Copied', description: 'Rules block copied to clipboard.' });
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-card/95 p-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-2">
          <button
            onClick={onExitEditMode}
            className="rounded-md bg-muted px-2 py-1.5 text-xs"
            title="Exit edit mode"
          >
            <X className="h-4 w-4" />
          </button>
          <span className="rounded bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
            EDIT MODE
          </span>
          <span className="text-xs text-muted-foreground">{total} pending</span>

          {selectionCount > 1 && (
            <>
              <Button size="sm" onClick={onMerge}>
                Merge {selectionCount}
              </Button>
              <Button size="sm" variant="ghost" onClick={onClearSelection}>
                Clear sel
              </Button>
            </>
          )}

          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowRules(true)}>
              View rules
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showRules} onOpenChange={setShowRules}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Token override rules</DialogTitle>
          </DialogHeader>

          <div className="flex gap-2">
            <button
              onClick={() => setScope(bookId)}
              className={`rounded px-3 py-1.5 text-xs font-semibold ${scope === bookId ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            >
              {bookId} ({bookBuf.length} new)
            </button>
            <button
              onClick={() => setScope('*')}
              className={`rounded px-3 py-1.5 text-xs font-semibold ${scope === '*' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            >
              * global ({globalBuf.length} new)
            </button>
          </div>

          <pre className="max-h-[50vh] overflow-auto rounded-md bg-muted p-3 text-[11px] leading-relaxed">
            <code>{block}</code>
          </pre>

          <div className="flex gap-2">
            <Button onClick={copy} className="flex-1">
              <Copy className="mr-1 h-3.5 w-3.5" /> Copy
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                clear(scope);
                toast({ title: 'Cleared', description: `Buffer for "${scope}" cleared.` });
              }}
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Clear buffer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
