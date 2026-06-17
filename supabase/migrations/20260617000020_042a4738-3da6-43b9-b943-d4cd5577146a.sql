ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS target_jlpt TEXT DEFAULT 'N4',
ADD COLUMN IF NOT EXISTS daily_goal_minutes INTEGER DEFAULT 20;