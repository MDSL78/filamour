"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";

export default function Bienvenue() {
  const router = useRouter();
  const [choice, setChoice] = useState<"create" | "join">("create");
  const [firstName, setFirstName] = useState("");
  const [since, setSince] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { error } =
      choice === "create"
        ? await supabase.rpc("create_couple", { p_first_name: firstName, p_since: since || null })
        : await supabase.rpc("join_couple", { p_first_name: firstName, p_code: code });
    if (error) {
      setError(error.message || "Une erreur est survenue. Réessaie.");
      setBusy(false);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  async function logout() {
    await createClient().auth.signOut();
    router.replace("/connexion");
  }

  return (
    <main className="narrow">
      <Logo />
      <h1>Bienvenue sur Filamour.</h1>
      <p className="sub">Dernière étape : relier ton compte à celui de ton ou ta partenaire.</p>
      <div className="seg" style={{ marginBottom: 16 }}>
        <button type="button" aria-pressed={choice === "create"} onClick={() => setChoice("create")}>Je commence</button>
        <button type="button" aria-pressed={choice === "join"} onClick={() => setChoice("join")}>J'ai un code</button>
      </div>
      <form className="card stack" onSubmit={submit}>
        <div>
          <label className="f" htmlFor="first">Ton prénom</label>
          <input id="first" required maxLength={40} autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        {choice === "create" ? (
          <>
            <div>
              <label className="f" htmlFor="since">Vous êtes ensemble depuis le</label>
              <input id="since" type="date" value={since} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setSince(e.target.value)} />
            </div>
            <p className="note" style={{ margin: 0 }}>Tu recevras ensuite un code à donner à ton ou ta partenaire.</p>
          </>
        ) : (
          <div>
            <label className="f" htmlFor="code">Code du couple</label>
            <input
              id="code"
              required
              maxLength={6}
              placeholder="Ex. 7F3A9C"
              style={{ textTransform: "uppercase", letterSpacing: ".1em" }}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
        )}
        {error && <div className="error" role="alert">{error}</div>}
        <button className="btn full" type="submit" disabled={busy}>
          {busy ? "Un instant…" : choice === "create" ? "Créer notre espace" : "Rejoindre notre espace"}
        </button>
      </form>
      <p className="note" style={{ marginTop: 16 }}>
        Pas le bon compte ? <button className="linkbtn" type="button" onClick={logout}>Se déconnecter</button>
      </p>
    </main>
  );
}
