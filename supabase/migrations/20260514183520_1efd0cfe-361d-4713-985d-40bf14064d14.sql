CREATE TABLE public.user_preferences (
  user_id uuid NOT NULL PRIMARY KEY,
  font_size text NOT NULL DEFAULT 'medium',
  reader_dark_mode boolean NOT NULL DEFAULT false,
  dark_mode boolean NOT NULL DEFAULT false,
  show_furigana boolean NOT NULL DEFAULT true,
  display_mode text NOT NULL DEFAULT 'normal',
  japanese_font text NOT NULL DEFAULT 'sans',
  has_seen_long_press_hint boolean NOT NULL DEFAULT false,
  show_known_highlights boolean NOT NULL DEFAULT true,
  highlight_new boolean NOT NULL DEFAULT true,
  highlight_learning boolean NOT NULL DEFAULT true,
  highlight_known boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own preferences" ON public.user_preferences
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();