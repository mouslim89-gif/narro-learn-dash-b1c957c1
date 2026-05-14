-- =========================================
-- USER PREFERENCES TABLE
-- =========================================
CREATE TABLE public.user_preferences (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  font_size TEXT NOT NULL DEFAULT 'medium',
  reader_dark_mode BOOLEAN NOT NULL DEFAULT false,
  dark_mode BOOLEAN NOT NULL DEFAULT false,
  show_furigana BOOLEAN NOT NULL DEFAULT false,
  display_mode TEXT NOT NULL DEFAULT 'normal',
  japanese_font TEXT NOT NULL DEFAULT 'sans',
  has_seen_long_press_hint BOOLEAN NOT NULL DEFAULT false,
  show_known_highlights BOOLEAN NOT NULL DEFAULT true,
  highlight_new BOOLEAN NOT NULL DEFAULT true,
  highlight_learning BOOLEAN NOT NULL DEFAULT true,
  highlight_known BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
  ON public.user_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime for multi-device sync
ALTER TABLE public.user_preferences REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_preferences;
