-- 1) reminders
CREATE TABLE public.reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  idol_id uuid REFERENCES public.idols(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'EVENT',
  days_before integer NOT NULL DEFAULT 3,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminders TO authenticated;
GRANT ALL ON public.reminders TO service_role;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY reminders_select_own ON public.reminders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY reminders_insert_own ON public.reminders FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id
  AND (event_id IS NULL OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.user_id = auth.uid()))
  AND (idol_id IS NULL OR EXISTS (SELECT 1 FROM public.idols i WHERE i.id = idol_id AND i.user_id = auth.uid()))
);
CREATE POLICY reminders_update_own ON public.reminders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (
  auth.uid() = user_id
  AND (event_id IS NULL OR EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.user_id = auth.uid()))
  AND (idol_id IS NULL OR EXISTS (SELECT 1 FROM public.idols i WHERE i.id = idol_id AND i.user_id = auth.uid()))
);
CREATE POLICY reminders_delete_own ON public.reminders FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER reminders_set_updated_at BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX reminders_user_id_idx ON public.reminders(user_id);

-- 2) sugar_items
CREATE TABLE public.sugar_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idol_id uuid REFERENCES public.idols(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT '',
  date date,
  type text NOT NULL DEFAULT 'MOMENT',
  note text NOT NULL DEFAULT '',
  image text NOT NULL DEFAULT '',
  link text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sugar_items TO authenticated;
GRANT ALL ON public.sugar_items TO service_role;
ALTER TABLE public.sugar_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY sugar_items_select_own ON public.sugar_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY sugar_items_insert_own ON public.sugar_items FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id
  AND (idol_id IS NULL OR EXISTS (SELECT 1 FROM public.idols i WHERE i.id = idol_id AND i.user_id = auth.uid()))
);
CREATE POLICY sugar_items_update_own ON public.sugar_items FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (
  auth.uid() = user_id
  AND (idol_id IS NULL OR EXISTS (SELECT 1 FROM public.idols i WHERE i.id = idol_id AND i.user_id = auth.uid()))
);
CREATE POLICY sugar_items_delete_own ON public.sugar_items FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER sugar_items_set_updated_at BEFORE UPDATE ON public.sugar_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX sugar_items_user_id_idx ON public.sugar_items(user_id);

-- 3) widget_preferences (singleton per user)
CREATE TABLE public.widget_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  idol_id uuid REFERENCES public.idols(id) ON DELETE SET NULL,
  enabled_contents text[] NOT NULL DEFAULT ARRAY['IDOL','MESSAGE','DECORATION','MOOD','COUNTDOWN']::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.widget_preferences TO authenticated;
GRANT ALL ON public.widget_preferences TO service_role;
ALTER TABLE public.widget_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY widget_preferences_select_own ON public.widget_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY widget_preferences_insert_own ON public.widget_preferences FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id
  AND (idol_id IS NULL OR EXISTS (SELECT 1 FROM public.idols i WHERE i.id = idol_id AND i.user_id = auth.uid()))
);
CREATE POLICY widget_preferences_update_own ON public.widget_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (
  auth.uid() = user_id
  AND (idol_id IS NULL OR EXISTS (SELECT 1 FROM public.idols i WHERE i.id = idol_id AND i.user_id = auth.uid()))
);
CREATE POLICY widget_preferences_delete_own ON public.widget_preferences FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER widget_preferences_set_updated_at BEFORE UPDATE ON public.widget_preferences FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();