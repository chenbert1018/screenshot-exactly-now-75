CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idol_id uuid NOT NULL REFERENCES public.idols(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'CUSTOM' CHECK (type IN ('BIRTHDAY','CONCERT','COMEBACK','TICKETING','VOTING','MERCH','FAN_MEETING','TRAVEL','SUPPORT','CUSTOM')),
  date date NOT NULL,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY events_select_own ON public.events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY events_insert_own ON public.events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.idols i WHERE i.id = idol_id AND i.user_id = auth.uid()));
CREATE POLICY events_update_own ON public.events FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.idols i WHERE i.id = idol_id AND i.user_id = auth.uid()));
CREATE POLICY events_delete_own ON public.events FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER events_set_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX events_user_date_idx ON public.events (user_id, date);
CREATE INDEX events_idol_idx ON public.events (idol_id);

CREATE TABLE public.milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title text NOT NULL,
  date date,
  emoji text NOT NULL DEFAULT '',
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.milestones TO authenticated;
GRANT ALL ON public.milestones TO service_role;

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY milestones_select_own ON public.milestones FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY milestones_insert_own ON public.milestones FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.user_id = auth.uid()));
CREATE POLICY milestones_update_own ON public.milestones FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.user_id = auth.uid()));
CREATE POLICY milestones_delete_own ON public.milestones FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER milestones_set_updated_at BEFORE UPDATE ON public.milestones FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX milestones_event_idx ON public.milestones (event_id);