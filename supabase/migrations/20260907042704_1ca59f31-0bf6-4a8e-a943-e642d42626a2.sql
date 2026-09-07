CREATE TABLE public.memory_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  idol_id uuid REFERENCES public.idols(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  cover_photo text NOT NULL DEFAULT '',
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.memory_folders TO authenticated;
GRANT ALL ON public.memory_folders TO service_role;

ALTER TABLE public.memory_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY memory_folders_select_own ON public.memory_folders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY memory_folders_insert_own ON public.memory_folders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND (idol_id IS NULL OR EXISTS (SELECT 1 FROM public.idols i WHERE i.id = idol_id AND i.user_id = auth.uid())));
CREATE POLICY memory_folders_update_own ON public.memory_folders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND (idol_id IS NULL OR EXISTS (SELECT 1 FROM public.idols i WHERE i.id = idol_id AND i.user_id = auth.uid())));
CREATE POLICY memory_folders_delete_own ON public.memory_folders FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER memory_folders_set_updated_at BEFORE UPDATE ON public.memory_folders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX memory_folders_user_idx ON public.memory_folders (user_id, created_at);

CREATE TABLE public.memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id uuid NOT NULL REFERENCES public.memory_folders(id) ON DELETE CASCADE,
  idol_id uuid REFERENCES public.idols(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  photo text NOT NULL DEFAULT '',
  date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.memories TO authenticated;
GRANT ALL ON public.memories TO service_role;

ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY memories_select_own ON public.memories FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY memories_insert_own ON public.memories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.memory_folders f WHERE f.id = folder_id AND f.user_id = auth.uid()) AND (idol_id IS NULL OR EXISTS (SELECT 1 FROM public.idols i WHERE i.id = idol_id AND i.user_id = auth.uid())));
CREATE POLICY memories_update_own ON public.memories FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.memory_folders f WHERE f.id = folder_id AND f.user_id = auth.uid()) AND (idol_id IS NULL OR EXISTS (SELECT 1 FROM public.idols i WHERE i.id = idol_id AND i.user_id = auth.uid())));
CREATE POLICY memories_delete_own ON public.memories FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER memories_set_updated_at BEFORE UPDATE ON public.memories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX memories_folder_idx ON public.memories (folder_id, date);