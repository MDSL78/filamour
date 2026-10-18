"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";

function frenchError(msg: string) {
  if (/invalid login/i.test(msg)) return "E-mail ou mot de passe incorrect.";
  if (/already registered/i.test(msg)) return "Un compte existe déjà avec cet e-mail. Connecte-toi.";
  if (/email not confirmed/i.test(msg)) return "Confirme d'abord ton e-mail avec le lien reçu.";
  if (/password/i.test(msg)) return "Le mot de passe doit faire au moins 8 caractères.";
  if (/rate limit/i.test(msg)) return "Trop de tentatives. Réessaie dans quelques minutes.";
       return "Une erreur est survenue : " + msg;
     }
export default function Connexion() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");
    const supabase = createClient();
    if (mode === "signup") {
      if (password.length < 8) {
        setError("Le mot de passe doit faire au moins 8 caractères.");
        setBusy(false);
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) setError(frenchError(error.message));
      else if (!data.session) setInfo("C'est presque fini : ouvre l'e-mail qu'on vient de t'envoyer pour confirmer ton compte.");
      else router.replace("/");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(frenchError(error.message));
      else router.replace("/");
    }
    setBusy(false);
  }

  return (
    <main className="narrow">
      <Logo />
      <h1>{mode === "signup" ? "Créez votre espace à deux." : "Content de te revoir."}</h1>
      <p className="sub">
        {mode === "signup"
          ? "Chacun crée son compte, puis vous reliez vos deux comptes avec un code."
          : "Connecte-toi pour retrouver votre histoire."}
      </p>
      <div className="seg" style={{ marginBottom: 16 }}>
        <button type="button" aria-pressed={mode === "signup"} onClick={() => setMode("signup")}>Créer un compte</button>
        <button type="button" aria-pressed={mode === "login"} onClick={() => setMode("login")}>Se connecter</button>
      </div>
      <form className="card stack" onSubmit={submit}>
        <div>
          <label className="f" htmlFor="email">E-mail</label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="f" htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <div className="error" role="alert">{error}</div>}
        {info && <div className="note" role="status">{info}</div>}
        <button className="btn full" type="submit" disabled={busy}>
          {busy ? "Un instant…" : mode === "signup" ? "Créer mon compte" : "Me connecter"}
        </button>
      </form>
      <p className="note" style={{ marginTop: 16 }}>
        En créant un compte, tu acceptes les conditions d'utilisation et la politique de confidentialité de Filamour.
      </p>
    </main>
  );
}
