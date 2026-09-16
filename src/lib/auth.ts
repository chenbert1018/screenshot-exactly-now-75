import { useCallback, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
};

/** 目前登入狀態（Email / Password only） */
export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user: session?.user ?? null, session, loading };
}

export function useAuthActions() {
  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    });
    return error?.message ?? null;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    return error?.message ?? null;
  }, []);

  return { signUp, signIn, signOut };
}

export type CloudProfile = {
  id: string;
  userId: string;
  displayName: string;
  mainIdolId: string | null;
  dateFormat: string;
  language: string;
  theme: string;
};

/** 讀取自己的 profile（註冊時由資料庫自動建立；缺少時補建） */
export async function fetchMyProfile(userId: string): Promise<CloudProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;

  let row = data;
  if (!row) {
    const inserted = await supabase
      .from("profiles")
      .insert({ user_id: userId })
      .select("*")
      .single();
    if (inserted.error) throw inserted.error;
    row = inserted.data;
  }

  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    mainIdolId: row.main_idol_id,
    dateFormat: row.date_format,
    language: row.language,
    theme: row.theme,
  };
}
