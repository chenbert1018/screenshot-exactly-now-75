-- Album sharing is deliberately scoped to one memory folder.  Public reads use
-- the shared-album Edge Function so no anonymous SELECT policy is needed.
CREATE TABLE public.album_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id uuid NOT NULL UNIQUE REFERENCES public.memory_folders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'PRIVATE' CHECK (mode IN ('PRIVATE', 'INVITED', 'PUBLIC')),
  public_token text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT album_shares_public_token_when_public CHECK (
    (mode = 'PUBLIC' AND public_token IS NOT NULL) OR mode <> 'PUBLIC'
  )
);

CREATE TABLE public.album_share_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id uuid NOT NULL REFERENCES public.album_shares(id) ON DELETE CASCADE,
  recipient_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT album_share_recipients_email_normalized CHECK (
    recipient_email = lower(btrim(recipient_email))
  ),
  CONSTRAINT album_share_recipients_share_email_unique UNIQUE (share_id, recipient_email)
);

CREATE INDEX album_shares_owner_idx ON public.album_shares (user_id);
CREATE INDEX album_share_recipients_email_idx ON public.album_share_recipients (recipient_email);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.album_shares TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.album_share_recipients TO authenticated;
GRANT ALL ON public.album_shares, public.album_share_recipients TO service_role;

ALTER TABLE public.album_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_share_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY album_shares_select_own ON public.album_shares
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY album_shares_insert_own ON public.album_shares
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.memory_folders f WHERE f.id = folder_id AND f.user_id = auth.uid()
    )
  );
CREATE POLICY album_shares_update_own ON public.album_shares
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.memory_folders f WHERE f.id = folder_id AND f.user_id = auth.uid()
    )
  );
CREATE POLICY album_shares_delete_own ON public.album_shares
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY album_share_recipients_select_owner ON public.album_share_recipients
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.album_shares s WHERE s.id = share_id AND s.user_id = auth.uid())
  );
CREATE POLICY album_share_recipients_insert_owner ON public.album_share_recipients
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.album_shares s WHERE s.id = share_id AND s.user_id = auth.uid())
  );
CREATE POLICY album_share_recipients_delete_owner ON public.album_share_recipients
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.album_shares s WHERE s.id = share_id AND s.user_id = auth.uid())
  );

CREATE TRIGGER album_shares_set_updated_at BEFORE UPDATE ON public.album_shares
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Authenticated recipients can read only the explicitly shared folder and its
-- memories.  There are intentionally no recipient write policies.
CREATE POLICY memory_folders_select_invited ON public.memory_folders
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM public.album_shares s
      JOIN public.album_share_recipients r ON r.share_id = s.id
      WHERE s.folder_id = memory_folders.id
        AND s.mode = 'INVITED'
        AND r.recipient_email = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

CREATE POLICY memories_select_invited ON public.memories
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1
      FROM public.album_shares s
      JOIN public.album_share_recipients r ON r.share_id = s.id
      WHERE s.folder_id = memories.folder_id
        AND s.mode = 'INVITED'
        AND r.recipient_email = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );
