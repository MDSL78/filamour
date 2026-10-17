import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AppShell from "@/components/AppShell";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: me } = await supabase.from("profiles").select("id, first_name, couple_id").eq("id", user.id).single();
  if (!me?.couple_id) redirect("/bienvenue");

  const [{ data: couple }, { data: members }] = await Promise.all([
    supabase.from("couples").select("id, invite_code, since, wallpaper_path, premium_until").eq("id", me.couple_id).single(),
    supabase.from("profiles").select("id, first_name").eq("couple_id", me.couple_id),
  ]);
  if (!couple) redirect("/bienvenue");

  return <AppShell userId={user.id} couple={couple} members={members ?? []} />;
}
