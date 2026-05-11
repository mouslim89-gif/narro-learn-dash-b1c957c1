## 1. Fix "permission denied" on publish

**Hypothèse la plus probable**: la policy `WITH CHECK (is_admin(auth.uid()))` est attachée au rôle `public`. Quand PostgREST appelle au nom du JWT, le rôle effectif est `authenticated`, mais `is_admin` est `SECURITY DEFINER` et lit `admin_users` — qui a sa propre RLS `is_admin(auth.uid())` sur `ALL`. Le `SELECT` à l'intérieur de `is_admin` peut être bloqué/vidé selon le contexte.

**Correctif DB (migration)**:
- Recréer `public.is_admin(uuid)` en `SECURITY DEFINER` avec `SET search_path = public` et un `SELECT` qui passe la RLS (déjà OK car SECURITY DEFINER + owner = postgres, mais on s'assure que le owner a bypass).
- Ajouter une policy SELECT dédiée non-récursive sur `admin_users`: `USING (true)` est déjà là — OK.
- Re-créer les policies de `shared_token_rules` en ciblant `TO authenticated` explicitement et en gardant SELECT public:
  - `SELECT TO public USING (true)`
  - `INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()))`
  - `UPDATE TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()))`
  - `DELETE TO authenticated USING (public.is_admin(auth.uid()))`

**Diagnostic front** (en parallèle, dans `addShared`):
- Logger `auth.uid()` retourné par `supabase.auth.getUser()` avant l'insert pour comparer à l'admin attendu, et logger `error.message`/`error.details`/`error.hint` complets.

## 2. Merge nombre + compteur (九時, 三人, 五分…)

**Nouveau passage** `mergeCounterCompounds(tokens)` dans `src/lib/merge-tokens.ts`, appliqué **après** `mergeConjugatedTokens` et **avant** `gluePhrasalCompounds`.

Règle:
- Token courant: nombre — détecté par `p?.startsWith('名詞/数')` **ou** surface entièrement composée de chiffres kanji (`一二三四五六七八九十百千万零〇`) ou de chiffres ascii/halfwidth.
- Token suivant: 名詞 dont la surface ∈ liste de compteurs autorisés.

Liste de compteurs (initiale, conservatrice):

```
時 分 秒 日 月 年 週 歳 才
人 名 匹 頭 羽 個 つ
本 枚 冊 台 階 軒 件 回 度
円 元 ドル
キロ メートル センチ
番 号 位 章 課 ページ 頁
```

Sortie:
- `t = a.t + b.t`
- `r = (a.r ?? '') + (b.r ?? '')` (concaténation Kuromoji simple, comme demandé)
- `b = a.t + b.t` (base = surface, suffisant pour le dico)
- `p = '名詞'`
- `j = true`

Cas spéciaux à éviter:
- Ne rien fusionner si le compteur est suivi d'une particule étrange ou si le nombre est lui-même déjà composé (laisse la 1ère passe faire son travail; on opère token par token).
- Si la liste devient gênante plus tard, on pourra exposer une règle partagée pour annuler/remplacer.

## 3. Fichiers touchés

- `supabase/migrations/<ts>_fix_shared_rules_admin.sql` — recreation des policies `shared_token_rules`, garantie `is_admin` propre.
- `src/stores/shared-rules.ts` — log diagnostique enrichi sur erreur d'insert.
- `src/lib/merge-tokens.ts` — ajoute `mergeCounterCompounds` + export, et l'appelle dans le pipeline.
- `src/pages/Reader.tsx` — insère l'appel à `mergeCounterCompounds` à l'endroit où les autres mergers sont appliqués (vérifier l'ordre exact lors de l'implémentation).

## Hors scope
- Lectures irrégulières (一日=ついたち, 二十歳=はたち…) — peut être ajouté ensuite via une petite table d'overrides, ou via une règle partagée par cas.
- Realtime sync sur `shared_token_rules`.
