import { useState } from'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from'@/components/ui/dialog';
import { Button } from'@/components/ui/button';
import { useUserRulesStore } from'@/stores/user-rules';
import { useSharedRulesStore } from'@/stores/shared-rules';
import { useAuth } from'@/contexts/AuthContext';
import { useIsAdmin } from'@/lib/admin';
import { formatRule } from'@/lib/token-edit-rules';
import { toast } from'@/hooks/use-toast';
import { Trash2, X, Undo2, Check, Settings2, Loader2 } from'lucide-react';

interface Props {
 bookId: string;
 selectionCount: number;
 onMerge: () => void;
 onClearSelection: () => void;
 onExitEditMode: () => void;
}

type ScopeKey = string; //'book'|'global'|'shared-book'|'shared-global'encoded as bookId/'*'/'sb'/'sg'export function TokenEditFloatingBar({ bookId, selectionCount, onMerge, onClearSelection, onExitEditMode }: Props) {
 const { user } = useAuth();
 const isAdmin = useIsAdmin();
 const { saved, pending, undoPending, clearPending, applyPending, deleteSaved } = useUserRulesStore();
 const { saved: shared, deleteShared } = useSharedRulesStore();
 const [scope, setScope] = useState<ScopeKey>(bookId);
 const [showManage, setShowManage] = useState(false);
 const [busy, setBusy] = useState(false);

 const bookPending = pending[bookId] ?? [];
 const globalPending = pending['*'] ?? [];
 const totalPending = bookPending.length + globalPending.length;

 const bookSaved = saved[bookId] ?? [];
 const globalSaved = saved['*'] ?? [];
 const sharedBook = shared[bookId] ?? [];
 const sharedGlobal = shared['*'] ?? [];

 const isSharedScope = scope ==='sb'|| scope ==='sg';
 const activePending = scope ==='*'? globalPending : scope === bookId ? bookPending : [];
 const activeSaved = scope ==='*'? globalSaved : scope === bookId ? bookSaved : [];
 const activeShared = scope ==='sb'? sharedBook : scope ==='sg'? sharedGlobal : [];

 const handleUndo = () => {
 const targetScope = bookPending.length > 0 ? bookId : globalPending.length > 0 ?'*': null;
 if (!targetScope) return;
 const popped = undoPending(targetScope);
 if (popped) toast({ title:'Undone', description: formatRule(popped) });
 };

 const handleApply = async () => {
 if (!user) {
 toast({ title:'Sign in required', description:'You need to be signed in to save rules.', variant:'destructive'});
 return;
 }
 setBusy(true);
 try {
 const { inserted } = await applyPending(user.id);
 toast({ title:'Applied', description:`${inserted} rule${inserted === 1 ?'':'s'} saved.`});
 } catch (e) {
 toast({ title:'Save failed', description: (e as Error).message, variant:'destructive'});
 } finally {
 setBusy(false);
 }
 };

 const handleDelete = async (id: string, scopeKey: string) => {
 try {
 await deleteSaved(id, scopeKey);
 toast({ title:'Deleted'});
 } catch {
 toast({ title:'Delete failed', variant:'destructive'});
 }
 };

 const handleDeleteShared = async (id: string, scopeKey: string) => {
 try {
 await deleteShared(id, scopeKey);
 toast({ title:'Removed from shared'});
 } catch {
 toast({ title:'Delete failed', variant:'destructive'});
 }
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
 <X className="h-4 w-4"/>
 </button>
 <span className="rounded bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">EDIT</span>
 {totalPending > 0 && (
 <span className="rounded bg-accent/20 px-2 py-1 text-xs font-semibold text-accent-foreground">
 {totalPending} pending
 </span>
 )}

 {selectionCount > 1 && (
 <div className="flex gap-1 rounded-md bg-accent/15 px-1 py-1">
 <Button size="sm"onClick={onMerge} className="h-7">Merge {selectionCount}</Button>
 <Button size="sm"variant="ghost"onClick={onClearSelection} className="h-7">Clear</Button>
 </div>
 )}

 <div className="ml-auto flex gap-1">
 <Button size="sm"variant="outline"onClick={handleUndo} disabled={totalPending === 0} title="Undo last pending rule"className="h-8 px-2">
 <Undo2 className="h-3.5 w-3.5"/>
 </Button>
 <Button size="sm"variant="outline"onClick={() => setShowManage(true)} className="h-8 px-2"title="Manage rules">
 <Settings2 className="h-3.5 w-3.5"/>
 </Button>
 <Button size="sm"onClick={handleApply} disabled={totalPending === 0 || busy || !user} className="h-8"title={!user ?'Sign in to save':'Save pending rules'}>
 {busy ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin"/> : <Check className="mr-1 h-3.5 w-3.5"/>}
 Apply{totalPending > 0 ?`(${totalPending})`:''}
 </Button>
 </div>
 </div>
 </div>

 <Dialog open={showManage} onOpenChange={setShowManage}>
 <DialogContent className="max-w-2xl">
 <DialogHeader>
 <DialogTitle>Token rules</DialogTitle>
 </DialogHeader>

 <div className="flex flex-wrap gap-2">
 <button
 onClick={() => setScope(bookId)}
 className={`rounded px-3 py-1.5 text-xs font-semibold ${scope === bookId ?'bg-primary text-primary-foreground':'bg-muted'}`}
 >
 {bookId} ({bookSaved.length}+{bookPending.length})
 </button>
 <button
 onClick={() => setScope('*')}
 className={`rounded px-3 py-1.5 text-xs font-semibold ${scope ==='*'?'bg-primary text-primary-foreground':'bg-muted'}`}
 >
 * global ({globalSaved.length}+{globalPending.length})
 </button>
 <button
 onClick={() => setScope('sb')}
 className={`rounded px-3 py-1.5 text-xs font-semibold ${scope ==='sb'?'bg-primary text-primary-foreground':'bg-muted'}`}
 >
 shared {bookId} ({sharedBook.length})
 </button>
 <button
 onClick={() => setScope('sg')}
 className={`rounded px-3 py-1.5 text-xs font-semibold ${scope ==='sg'?'bg-primary text-primary-foreground':'bg-muted'}`}
 >
 shared * ({sharedGlobal.length})
 </button>
 </div>

 <div className="max-h-[55vh] space-y-3 overflow-auto">
 {!isSharedScope && activePending.length > 0 && (
 <section>
 <div className="mb-1 flex items-center justify-between">
 <h3 className="text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">Pending</h3>
 <Button size="sm"variant="ghost"className="h-6 px-2 text-xs"onClick={() => clearPending(scope)}>
 Clear
 </Button>
 </div>
 <ul className="space-y-1">
 {activePending.map((r, i) => (
 <li key={i} className="flex items-center gap-2 rounded bg-accent/10 px-2 py-1.5">
 <code className="flex-1 truncate text-[11px]">{formatRule(r)}</code>
 <span className="rounded bg-accent/30 px-1.5 py-0.5 text-[9px] uppercase">pending</span>
 </li>
 ))}
 </ul>
 </section>
 )}

 {isSharedScope ? (
 <section>
 <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
 Shared ({activeShared.length}) — visible to all accounts
 </h3>
 {activeShared.length === 0 ? (
 <p className="rounded bg-muted/40 px-2 py-2 text-xs text-muted-foreground">No shared rules yet.</p>
 ) : (
 <ul className="space-y-1">
 {activeShared.map((r) => (
 <li key={r.id} className="flex items-center gap-2 rounded bg-primary/5 px-2 py-1.5">
 <code className="flex-1 truncate text-[11px]">{formatRule(r.rule)}</code>
 {isAdmin && (
 <Button size="sm"variant="ghost"className="h-7 w-7 p-0"onClick={() => handleDeleteShared(r.id, scope ==='sb'? bookId :'*')} title="Remove from shared">
 <Trash2 className="h-3.5 w-3.5"/>
 </Button>
 )}
 </li>
 ))}
 </ul>
 )}
 </section>
 ) : (
 <section>
 <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
 Saved ({activeSaved.length})
 </h3>
 {activeSaved.length === 0 ? (
 <p className="rounded bg-muted/40 px-2 py-2 text-xs text-muted-foreground">No saved rules yet.</p>
 ) : (
 <ul className="space-y-1">
 {activeSaved.map((r) => (
 <li key={r.id} className="flex items-center gap-2 rounded bg-muted/40 px-2 py-1.5">
 <code className="flex-1 truncate text-[11px]">{formatRule(r.rule)}</code>
 <Button size="sm"variant="ghost"className="h-7 w-7 p-0"onClick={() => handleDelete(r.id, scope)} title="Delete">
 <Trash2 className="h-3.5 w-3.5"/>
 </Button>
 </li>
 ))}
 </ul>
 )}
 </section>
 )}
 </div>

 {!user && (
 <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
 Sign in to save and sync your rules across devices.
 </p>
 )}
 </DialogContent>
 </Dialog>
 </>
 );
}
