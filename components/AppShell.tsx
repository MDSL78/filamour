"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { shrinkImage } from "@/lib/image";
import { GIFT_EVENTS, IDEAS, questionFor, todayParis } from "@/lib/content";
import Logo from "@/components/Logo";

type Couple = { id: string; invite_code: string; since: string | null; wallpaper_path: string | null; premium_until: string | null };
type Member = { id: string; first_name: string | null };
type Memory = { id: string; title: string; happened_on: string; body: string | null; photo_path: string | null; author_id: string };
type Bucket = { id: string; title: string; done: boolean };
type Tab = "home" | "mem" | "dates" | "gifts";
type Sheet = null | "couple" | "ideas" | "premium";

const BUCKET = "couple-photos";
const FREE_IDEAS_PER_WEEK = 3;

function fmtDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
function daysBetween(fromIso: string, toIso: string) {
  return Math.round((Date.parse(toIso + "T00:00:00Z") - Date.parse(fromIso + "T00:00:00Z")) / 86400000);
}
function nextOccurrence(month: number, day: number, todayIso: string) {
  const y = Number(todayIso.slice(0, 4));
  const pad = (n: number) => String(n).padStart(2, "0");
  let iso = `${y}-${pad(month)}-${pad(day)}`;
  if (iso < todayIso) iso = `${y + 1}-${pad(month)}-${pad(day)}`;
  return iso;
}
function weekKey(todayIso: string) {
  const d = new Date(todayIso + "T00:00:00Z");
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}
const ls = {
  get(k: string, d: string) { try { return localStorage.getItem("fa_" + k) ?? d; } catch { return d; } },
  set(k: string, v: string) { try { localStorage.setItem("fa_" + k, v); } catch { /* stockage indisponible */ } },
};

export default function AppShell({ userId, couple: initialCouple, members }: { userId: string; couple: Couple; members: Member[] }) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [couple, setCouple] = useState<Couple>(initialCouple);
  const [tab, setTab] = useState<Tab>("home");
  const [sheet, setSheet] = useState<Sheet>(null);
  const [toast, setToast] = useState("");
  const [wallUrl, setWallUrl] = useState<string>("");
  const [veil, setVeil] = useState(0.7);

  const me = members.find((m) => m.id === userId);
  const partner = members.find((m) => m.id !== userId);
  const myName = me?.first_name || "Toi";
  const partnerName = partner?.first_name || "ton ou ta partenaire";
  const isPremium = !!couple.premium_until && new Date(couple.premium_until) > new Date();
  const today = todayParis();

  const flash = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2400);
  }, []);

  // Fond d'écran
  useEffect(() => {
    setVeil(Number(ls.get("veil", "0.7")));
  }, []);
  useEffect(() => {
    let alive = true;
    if (!couple.wallpaper_path) { setWallUrl(""); return; }
    supabase.storage.from(BUCKET).createSignedUrl(couple.wallpaper_path, 60 * 60 * 6).then(({ data }) => {
      if (alive) setWallUrl(data?.signedUrl ?? "");
    });
    return () => { alive = false; };
  }, [couple.wallpaper_path, supabase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSheet(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {wallUrl && <div className="wall" style={{ backgroundImage: `url("${wallUrl}")`, ["--veil" as string]: veil } as React.CSSProperties} />}
      <div className="app">
        <header className="top">
          <Logo />
          <div className="hdr">
            <button className={`pill ${isPremium ? "on" : ""}`} type="button" onClick={() => setSheet("premium")}>
              {isPremium ? "Premium à deux" : "Gratuit"}
            </button>
            <button className="avs" type="button" aria-label="Notre couple et fond d'écran" onClick={() => setSheet("couple")}>
              <span className="av me">{myName[0]?.toUpperCase()}</span>
              <span className="av">{partner?.first_name?.[0]?.toUpperCase() ?? "?"}</span>
            </button>
          </div>
        </header>
        <main>
          {tab === "home" && (
            <HomeView supabase={supabase} couple={couple} userId={userId} myName={myName} partner={partner} partnerName={partnerName}
              today={today} hasWall={!!wallUrl} openCouple={() => setSheet("couple")} flash={flash} />
          )}
          {tab === "mem" && <MemoriesView supabase={supabase} coupleId={couple.id} userId={userId} today={today} flash={flash} />}
          {tab === "dates" && <DatesView supabase={supabase} coupleId={couple.id} isPremium={isPremium} today={today} flash={flash} openPremium={() => setSheet("premium")} />}
          {tab === "gifts" && <GiftsView openIdeas={() => setSheet("ideas")} openPremium={() => setSheet("premium")} />}
        </main>
      </div>

      <nav className="tabs" aria-label="Navigation">
        <div className="in" role="tablist">
          {([
            ["home", "Nous", <path key="p" d="M12 21s-7-4.4-9.3-9A5.3 5.3 0 0 1 12 6a5.3 5.3 0 0 1 9.3 6c-2.3 4.6-9.3 9-9.3 9z" />],
            ["mem", "Souvenirs", <g key="p"><rect x="3" y="5" width="18" height="15" rx="3" /><circle cx="9" cy="11" r="2" /><path d="m21 17-5-5-8 8" /></g>],
            ["dates", "Dates", <g key="p"><path d="M12 2v3M5 5l2 2M19 5l-2 2M4 13a8 8 0 0 0 16 0z" /><path d="M8 21h8" /></g>],
            ["gifts", "Cadeaux", <g key="p"><rect x="3" y="8" width="18" height="13" rx="2" /><path d="M12 8v13M3 12h18M12 8S10 3 7.5 4 9 8 12 8zM12 8s2-5 4.5-4S15 8 12 8z" /></g>],
          ] as [Tab, string, React.ReactNode][]).map(([k, label, icon]) => (
            <button key={k} className="tab" role="tab" type="button" aria-selected={tab === k} onClick={() => { setTab(k); window.scrollTo(0, 0); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
              {label}
            </button>
          ))}
        </div>
      </nav>

      {sheet && (
        <div className="sheet" onClick={(e) => { if (e.target === e.currentTarget) setSheet(null); }}>
          <div className="panel" role="dialog" aria-modal="true">
            {sheet === "couple" && (
              <CoupleSheet supabase={supabase} couple={couple} setCouple={setCouple} members={members} userId={userId}
                wallUrl={wallUrl} veil={veil} setVeil={(v) => { setVeil(v); ls.set("veil", String(v)); }}
                isPremium={isPremium} flash={flash} close={() => setSheet(null)}
                logout={async () => { await supabase.auth.signOut(); router.replace("/connexion"); }} />
            )}
            {sheet === "ideas" && <IdeasSheet couple={couple} partnerName={partner?.first_name || null} today={today} close={() => setSheet(null)} />}
            {sheet === "premium" && <PremiumSheet isPremium={isPremium} until={couple.premium_until} close={() => setSheet(null)} />}
          </div>
        </div>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}

type SB = ReturnType<typeof createClient>;

function SheetHead({ title, close }: { title: string; close: () => void }) {
  return (
    <div className="head">
      <h2 style={{ margin: 0 }}>{title}</h2>
      <button className="x" type="button" aria-label="Fermer" onClick={close}>×</button>
    </div>
  );
}

/* ---------------- Accueil ---------------- */
function HomeView({ supabase, couple, userId, myName, partner, partnerName, today, hasWall, openCouple, flash }: {
  supabase: SB; couple: Couple; userId: string; myName: string; partner?: Member; partnerName: string;
  today: string; hasWall: boolean; openCouple: () => void; flash: (m: string) => void;
}) {
  const [answers, setAnswers] = useState<{ user_id: string; answer: string }[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const question = questionFor(today);

  const load = useCallback(async () => {
    const { data } = await supabase.from("answers").select("user_id, answer").eq("question_date", today);
    setAnswers(data ?? []);
  }, [supabase, today]);

  useEffect(() => {
    load();
    const onVis = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [load]);

  const mine = answers.find((a) => a.user_id === userId);
  const theirs = answers.find((a) => a.user_id !== userId);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setBusy(true);
    const { error } = await supabase.from("answers").insert({ couple_id: couple.id, user_id: userId, question_date: today, answer: text });
    setBusy(false);
    if (error) { flash("Ta réponse n'a pas pu être envoyée. Réessaie."); return; }
    setDraft("");
    await load();
    flash(partner ? "Réponse envoyée" : "Réponse enregistrée");
  }

  const days = couple.since ? daysBetween(couple.since, today) : null;
  const next = days !== null ? Math.ceil((days + 1) / 100) * 100 : null;

  return (
    <div className="view stack">
      <section className="hero">
        <div className="names">
          {myName}{partner?.first_name ? ` & ${partner.first_name}` : ""}
          {couple.since ? ` · ensemble depuis le ${fmtDate(couple.since)}` : ""}
        </div>
        {days !== null ? (
          <>
            <div className="big">{days.toLocaleString("fr-FR")}<span>jours</span></div>
            <div className="next">Encore {next! - days} jours avant vos {next} jours</div>
            <div className="bar"><i style={{ width: `${days % 100}%` }} /></div>
          </>
        ) : (
          <div style={{ marginTop: 10 }}>
            <button className="btn small" type="button" onClick={openCouple}>Ajouter la date de votre rencontre</button>
          </div>
        )}
      </section>

      {!partner && (
        <section className="card stack">
          <div className="label">Invite ton ou ta partenaire</div>
          <div>Pour relier vos deux comptes, il ou elle crée son compte puis entre ce code :</div>
          <div className="code">{couple.invite_code}</div>
          <button className="btn ghost small" type="button" style={{ alignSelf: "flex-start" }}
            onClick={() => navigator.clipboard?.writeText(couple.invite_code).then(() => flash("Code copié"), () => flash(`Code : ${couple.invite_code}`))}>
            Copier le code
          </button>
        </section>
      )}

      {!hasWall && (
        <button className="gift" type="button" style={{ flexDirection: "row", alignItems: "center" }} onClick={openCouple}>
          <div className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="5" width="18" height="15" rx="3" /><circle cx="9" cy="11" r="2" /><path d="m21 17-5-5-8 8" /></svg></div>
          <div style={{ minWidth: 0 }}><b>Mettez une photo de vous deux en fond</b><br /><small>Elle s&apos;affiche sur vos deux téléphones.</small></div>
        </button>
      )}

      <section className="card qbox">
        <div className="label">Question du jour · {new Date(today + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</div>
        <div className="q">{question}</div>
        {!mine && (
          <form className="stack" onSubmit={send}>
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={1000} required
              placeholder={partner ? `Ta réponse… ${partnerName} ne la verra qu'après avoir répondu aussi.` : "Ta réponse…"} />
            <button className="btn" type="submit" disabled={busy}>{busy ? "Envoi…" : "Envoyer ma réponse"}</button>
          </form>
        )}
        <div className="answers">
          <div className="ans"><div className="who">{myName} (toi)</div><div>{mine ? mine.answer : <span style={{ color: "var(--muted)" }}>Pas encore répondu</span>}</div></div>
          <div className="ans">
            <div className="who">{partner?.first_name || "Partenaire"}</div>
            {!partner ? <div style={{ color: "var(--muted)" }}>Pas encore relié·e</div>
              : !mine ? <div className="blur">Réponse cachée jusqu&apos;à ce que tu répondes</div>
              : theirs ? <div>{theirs.answer}</div>
              : <div style={{ color: "var(--muted)" }}>Pas encore répondu</div>}
          </div>
        </div>
        {mine && partner && !theirs && (
          <button className="linkbtn" type="button" style={{ marginTop: 10, fontSize: 13 }} onClick={load}>Actualiser</button>
        )}
      </section>
    </div>
  );
}

/* ---------------- Souvenirs ---------------- */
function MemoriesView({ supabase, coupleId, userId, today, flash }: { supabase: SB; coupleId: string; userId: string; today: string; flash: (m: string) => void }) {
  const [items, setItems] = useState<Memory[] | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(today);
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("memories").select("id, title, happened_on, body, photo_path, author_id").order("happened_on", { ascending: false });
    const list = data ?? [];
    setItems(list);
    const paths = list.map((m) => m.photo_path).filter(Boolean) as string[];
    if (paths.length) {
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 60 * 60);
      const map: Record<string, string> = {};
      signed?.forEach((s) => { if (s.path && s.signedUrl) map[s.path] = s.signedUrl; });
      setUrls(map);
    }
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    let photo_path: string | null = null;
    try {
      if (file) {
        const blob = await shrinkImage(file);
        photo_path = `${coupleId}/${crypto.randomUUID()}.jpg`;
        const { error } = await supabase.storage.from(BUCKET).upload(photo_path, blob, { contentType: "image/jpeg" });
        if (error) throw new Error("La photo n'a pas pu être envoyée.");
      }
      const { error } = await supabase.from("memories").insert({
        couple_id: coupleId, author_id: userId, title: title.trim(), happened_on: date, body: body.trim() || null, photo_path,
      });
      if (error) throw new Error("Le souvenir n'a pas pu être enregistré.");
      setTitle(""); setBody(""); setFile(null); setOpen(false);
      flash("Souvenir enregistré");
      await load();
    } catch (err) {
      flash(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
    setBusy(false);
  }

  async function remove(m: Memory) {
    if (m.photo_path) await supabase.storage.from(BUCKET).remove([m.photo_path]);
    await supabase.from("memories").delete().eq("id", m.id);
    setConfirmId(null);
    flash("Souvenir supprimé");
    load();
  }

  return (
    <div className="view">
      <h2>Vos souvenirs</h2>
      <p className="sub">{items ? `${items.length} moment${items.length > 1 ? "s" : ""} gardé${items.length > 1 ? "s" : ""}.` : "Chargement…"}</p>
      {!open ? (
        <button className="btn full" type="button" style={{ marginBottom: 18 }} onClick={() => setOpen(true)}>Ajouter un souvenir</button>
      ) : (
        <form className="card stack" style={{ marginBottom: 18 }} onSubmit={add}>
          <div><label className="f" htmlFor="mt">Titre</label><input id="mt" required maxLength={120} placeholder="Ex. Notre premier concert" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><label className="f" htmlFor="md">Date</label><input id="md" type="date" required max={today} value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div><label className="f" htmlFor="mb">Ce que tu veux retenir</label><textarea id="mb" maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} /></div>
          <div><label className="f" htmlFor="mp">Photo (facultatif)</label><input id="mp" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
          <div className="row">
            <button className="btn" type="submit" disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer"}</button>
            <button className="btn ghost" type="button" onClick={() => setOpen(false)}>Annuler</button>
          </div>
        </form>
      )}
      {items && items.length === 0 && (
        <div className="card empty">Votre frise est vide pour l&apos;instant. Commencez par votre premier rendez-vous.</div>
      )}
      {items && items.length > 0 && (
        <div className="tl">
          {items.map((m) => (
            <article className="mem card" key={m.id}>
              {m.photo_path && urls[m.photo_path] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="ph" src={urls[m.photo_path]} alt={m.title} loading="lazy" />
              )}
              <div className="date">{fmtDate(m.happened_on)}</div>
              <h3>{m.title}</h3>
              {m.body && <div style={{ color: "var(--muted)", whiteSpace: "pre-wrap" }}>{m.body}</div>}
              <div className="actions">
                {confirmId === m.id ? (
                  <div className="row">
                    <button className="btn small" type="button" onClick={() => remove(m)}>Supprimer définitivement</button>
                    <button className="btn ghost small" type="button" onClick={() => setConfirmId(null)}>Garder</button>
                  </div>
                ) : (
                  <button className="linkbtn" type="button" style={{ fontSize: 13, color: "var(--muted)" }} onClick={() => setConfirmId(m.id)}>Supprimer</button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Dates ---------------- */
function DatesView({ supabase, coupleId, isPremium, today, flash, openPremium }: {
  supabase: SB; coupleId: string; isPremium: boolean; today: string; flash: (m: string) => void; openPremium: () => void;
}) {
  const [budget, setBudget] = useState<"all" | "free" | "low" | "high">("all");
  const [where, setWhere] = useState<"all" | "home" | "out">("all");
  const [idx, setIdx] = useState(0);
  const [seen, setSeen] = useState(1);
  const [bucket, setBucket] = useState<Bucket[]>([]);
  const [custom, setCustom] = useState("");
  const wk = weekKey(today);

  useEffect(() => {
    const saved = ls.get("ideas_week", "");
    setSeen(saved.startsWith(wk + ":") ? Number(saved.split(":")[1]) : 1);
  }, [wk]);

  const loadBucket = useCallback(async () => {
    const { data } = await supabase.from("bucket_items").select("id, title, done").order("created_at");
    setBucket(data ?? []);
  }, [supabase]);
  useEffect(() => { loadBucket(); }, [loadBucket]);

  const list = IDEAS.filter((i) => (budget === "all" || i.b === budget) && (where === "all" || i.w === where));
  const idea = list.length ? list[idx % list.length] : null;
  const labels = { free: "Gratuit", low: "Moins de 30 €", high: "Plus de 30 €" } as const;

  function nextIdea() {
    if (!isPremium && seen >= FREE_IDEAS_PER_WEEK) { openPremium(); return; }
    const n = seen + 1;
    setSeen(n);
    ls.set("ideas_week", `${wk}:${n}`);
    setIdx(idx + 1);
  }
  async function addBucket(title: string) {
    if (!title.trim() || bucket.some((b) => b.title === title.trim())) return;
    const { error } = await supabase.from("bucket_items").insert({ couple_id: coupleId, title: title.trim() });
    if (error) { flash("Impossible d'ajouter cette idée."); return; }
    flash("Ajouté à votre liste");
    loadBucket();
  }
  async function toggle(b: Bucket) {
    setBucket(bucket.map((x) => (x.id === b.id ? { ...x, done: !x.done } : x)));
    await supabase.from("bucket_items").update({ done: !b.done }).eq("id", b.id);
  }
  async function del(b: Bucket) {
    setBucket(bucket.filter((x) => x.id !== b.id));
    await supabase.from("bucket_items").delete().eq("id", b.id);
  }

  const chip = <T extends string>(val: T, cur: T, set: (v: T) => void, label: string) => (
    <button className="chip" type="button" aria-pressed={cur === val} onClick={() => { set(val); setIdx(0); }}>{label}</button>
  );

  return (
    <div className="view">
      <h2>Idées de dates</h2>
      <p className="sub">{isPremium ? "Idées illimitées." : `${FREE_IDEAS_PER_WEEK} idées par semaine en gratuit, illimité en Premium.`}</p>
      <div className="chips">{chip("all", budget, setBudget, "Tout budget")}{chip("free", budget, setBudget, "Gratuit")}{chip("low", budget, setBudget, "< 30 €")}{chip("high", budget, setBudget, "Plus")}</div>
      <div className="chips">{chip("all", where, setWhere, "Partout")}{chip("home", where, setWhere, "À la maison")}{chip("out", where, setWhere, "Dehors")}</div>
      {idea ? (
        <section className="card idea">
          <div className="label">Idée {(idx % list.length) + 1} sur {list.length}</div>
          <div className="t">{idea.t}</div>
          <p style={{ margin: "0 0 10px" }}>{idea.d}</p>
          <div className="meta"><span>{labels[idea.b]}</span><span>{idea.w === "home" ? "À la maison" : "Dehors"}</span><span>{idea.time}</span></div>
          <div className="row" style={{ marginTop: 14 }}>
            <button className="btn" type="button" onClick={nextIdea}>Autre idée</button>
            <button className="btn ghost" type="button" onClick={() => addBucket(idea.t)}>Ajouter à notre liste</button>
          </div>
        </section>
      ) : (
        <div className="card">Aucune idée pour ces filtres. Essaie un autre budget.</div>
      )}
      <h2 style={{ fontSize: 21 }}>Notre liste à deux</h2>
      <form className="row" style={{ marginBottom: 10 }} onSubmit={(e) => { e.preventDefault(); addBucket(custom); setCustom(""); }}>
        <input style={{ flex: 1, minWidth: 0 }} placeholder="Ajouter une envie à deux…" maxLength={160} value={custom} onChange={(e) => setCustom(e.target.value)} aria-label="Nouvelle envie" />
        <button className="btn" type="submit">Ajouter</button>
      </form>
      {bucket.length === 0 ? (
        <div className="card empty">Ajoutez ici tout ce que vous rêvez de faire ensemble.</div>
      ) : (
        <ul className="list">
          {bucket.map((b) => (
            <li key={b.id} className={b.done ? "done" : ""}>
              <input type="checkbox" id={`bk-${b.id}`} checked={b.done} onChange={() => toggle(b)} />
              <label htmlFor={`bk-${b.id}`}>{b.title}</label>
              <button className="x" type="button" aria-label={`Retirer ${b.title}`} style={{ width: 28, height: 28, fontSize: 15 }} onClick={() => del(b)}>×</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------------- Cadeaux ---------------- */
const giftIcon = (d: React.ReactNode) => (
  <div className="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{d}</svg></div>
);

function GiftsView({ openIdeas, openPremium }: { openIdeas: () => void; openPremium: () => void }) {
  const soon = [
    ["Calendrier de l'Avent", "24 cases de souvenirs, défis et mots doux.", <g key="i"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></g>],
    ["Wrapped du couple", "Votre année en stories à faire défiler.", <path key="i" d="M4 20V10M10 20V4M16 20v-7M22 20H2" />],
    ["Lettres « Ouvre quand… »", "Des messages qui se débloquent au bon moment.", <g key="i"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></g>],
    ["Chasse au trésor", "Des énigmes sur votre histoire, jusqu'à une surprise.", <g key="i"><path d="M12 22s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12z" /><circle cx="12" cy="10" r="2.5" /></g>],
  ] as [string, string, React.ReactNode][];
  return (
    <div className="view">
      <h2>Cadeaux à offrir</h2>
      <p className="sub">Des idées pour chaque occasion, et bientôt des cadeaux créés à partir de vos souvenirs.</p>
      <div className="gifts">
        <button className="gift wide" type="button" onClick={openIdeas}>
          {giftIcon(<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" />)}
          <b>Idées cadeaux par événement</b>
          <small>Noël, Saint-Valentin, anniversaires… des idées selon le budget, avec les dates à venir.</small>
        </button>
        {soon.map(([t, d, icon]) => (
          <button key={t} className="gift" type="button" onClick={openPremium}>
            {giftIcon(icon)}<b>{t}</b><small>{d}</small><span className="soon">Premium · bientôt</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function IdeasSheet({ couple, partnerName, today, close }: { couple: Couple; partnerName: string | null; today: string; close: () => void }) {
  const [sel, setSel] = useState("noel");
  const events = GIFT_EVENTS.map((e) => {
    let date: string | null = null;
    if (e.month && e.day) date = nextOccurrence(e.month, e.day, today);
    if (e.k === "couple" && couple.since) date = nextOccurrence(Number(couple.since.slice(5, 7)), Number(couple.since.slice(8, 10)), today);
    return { ...e, t: e.k === "anniv" && partnerName ? `Anniversaire de ${partnerName}` : e.t, date };
  });
  const ev = events.find((e) => e.k === sel)!;
  return (
    <>
      <SheetHead title="Idées cadeaux" close={close} />
      <p className="sub">Choisis l&apos;occasion.</p>
      <div className="evts" role="group" aria-label="Occasion">
        {events.map((e) => (
          <button key={e.k} className="evt" type="button" aria-pressed={e.k === sel} onClick={() => setSel(e.k)}>
            <b>{e.t}</b>
            <small>{e.date ? `dans ${daysBetween(today, e.date)} jours` : "toute l'année"}</small>
          </button>
        ))}
      </div>
      {ev.date && (
        <div className="card" style={{ marginBottom: 12, padding: "12px 14px" }}>
          <span className="label">Date</span>
          <div style={{ fontSize: 14 }}>{ev.t} le {fmtDate(ev.date)}.</div>
        </div>
      )}
      <div className="stack">
        {ev.ideas.map((i) => (
          <div className="card" key={i.t}>
            <div className="gi">
              <div>
                <h3>{i.t}</h3>
                <div style={{ color: "var(--muted)", fontSize: 14 }}>{i.d}</div>
                <span className="tag" style={i.inApp ? { background: "var(--accent-soft)", color: "var(--accent)" } : undefined}>{i.tag}</span>
              </div>
              <div className="price">{i.p}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function PremiumSheet({ isPremium, until, close }: { isPremium: boolean; until: string | null; close: () => void }) {
  return (
    <>
      <SheetHead title="Filamour Premium" close={close} />
      {isPremium ? (
        <p className="sub">Premium est actif pour vous deux jusqu&apos;au {new Date(until!).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.</p>
      ) : (
        <p className="sub">Un seul abonnement pour vous deux : 4,99 € par mois ou 39 € par an.</p>
      )}
      <ul className="list" style={{ marginBottom: 16 }}>
        <li>Un seul abonnement pour vos deux comptes</li>
        <li>Tous les cadeaux en illimité : calendrier de l&apos;Avent, Wrapped, lettres, chasse au trésor</li>
        <li>Idées de dates illimitées et défis mensuels</li>
        <li>Souvenirs et photos sans limite</li>
      </ul>
      {!isPremium && <div className="card note">L&apos;abonnement ouvre très bientôt. En attendant, tout le reste de l&apos;appli est disponible gratuitement.</div>}
    </>
  );
}

/* ---------------- Couple ---------------- */
function CoupleSheet({ supabase, couple, setCouple, members, userId, wallUrl, veil, setVeil, isPremium, flash, close, logout }: {
  supabase: SB; couple: Couple; setCouple: (c: Couple) => void; members: Member[]; userId: string; wallUrl: string;
  veil: number; setVeil: (v: number) => void; isPremium: boolean; flash: (m: string) => void; close: () => void; logout: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [since, setSince] = useState(couple.since ?? "");

  async function uploadWall(file: File) {
    setBusy(true);
    try {
      const blob = await shrinkImage(file, 1800);
      const path = `${couple.id}/wallpaper-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "image/jpeg" });
      if (error) throw new Error("La photo n'a pas pu être envoyée.");
      const old = couple.wallpaper_path;
      const { error: e2 } = await supabase.from("couples").update({ wallpaper_path: path }).eq("id", couple.id);
      if (e2) throw new Error("Le fond d'écran n'a pas pu être enregistré.");
      if (old) await supabase.storage.from(BUCKET).remove([old]);
      setCouple({ ...couple, wallpaper_path: path });
      flash("Fond d'écran mis à jour");
    } catch (err) {
      flash(err instanceof Error ? err.message : "Une erreur est survenue.");
    }
    setBusy(false);
  }
  async function removeWall() {
    const old = couple.wallpaper_path;
    await supabase.from("couples").update({ wallpaper_path: null }).eq("id", couple.id);
    if (old) await supabase.storage.from(BUCKET).remove([old]);
    setCouple({ ...couple, wallpaper_path: null });
    flash("Fond d'écran retiré");
  }
  async function saveSince() {
    const { error } = await supabase.from("couples").update({ since: since || null }).eq("id", couple.id);
    if (error) { flash("La date n'a pas pu être enregistrée."); return; }
    setCouple({ ...couple, since: since || null });
    flash("Date enregistrée");
  }

  return (
    <>
      <SheetHead title="Notre couple" close={close} />
      <section className="card stack" style={{ marginBottom: 12 }}>
        <div className="label">Fond d&apos;écran</div>
        <div className="wp" style={wallUrl ? { backgroundImage: `url("${wallUrl}")`, borderStyle: "solid" } : undefined}>{wallUrl ? "" : "Aucune photo pour l'instant"}</div>
        <div className="row">
          <label className="btn small fileBtn">
            {busy ? "Envoi…" : wallUrl ? "Changer la photo" : "Choisir une photo du couple"}
            <input type="file" accept="image/*" disabled={busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadWall(f); e.target.value = ""; }} />
          </label>
          {wallUrl && <button className="btn ghost small" type="button" onClick={removeWall}>Retirer</button>}
        </div>
        {wallUrl && (
          <>
            <label htmlFor="veil" className="note">Voile pour garder le texte lisible (sur cet appareil)</label>
            <input type="range" id="veil" min={0.3} max={0.9} step={0.05} value={veil} onChange={(e) => setVeil(Number(e.target.value))} />
          </>
        )}
      </section>

      <section className="card stack" style={{ marginBottom: 12 }}>
        <div className="label">Date de votre rencontre</div>
        <div className="row">
          <input type="date" style={{ flex: 1, minWidth: 0 }} value={since} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setSince(e.target.value)} aria-label="Date de votre rencontre" />
          <button className="btn small" type="button" onClick={saveSince}>Enregistrer</button>
        </div>
      </section>

      <section className="card stack" style={{ marginBottom: 12 }}>
        <div className="label">Un abonnement pour deux</div>
        {members.map((m) => (
          <div className="member" key={m.id}>
            <span className={`av ${m.id === userId ? "me" : ""}`}>{(m.first_name || "?")[0].toUpperCase()}</span>
            <div>
              <b>{m.first_name || "Sans prénom"}{m.id === userId ? " (toi)" : ""}</b>
              <div className="status ok">Connecté·e · {isPremium ? "Premium inclus" : "Version gratuite"}</div>
            </div>
          </div>
        ))}
        {members.length < 2 && (
          <>
            <div className="note">Ton ou ta partenaire crée son compte, choisit « J&apos;ai un code » et entre :</div>
            <div className="code">{couple.invite_code}</div>
            <button className="btn ghost small" type="button" style={{ alignSelf: "flex-start" }}
              onClick={() => navigator.clipboard?.writeText(couple.invite_code).then(() => flash("Code copié"), () => flash(`Code : ${couple.invite_code}`))}>
              Copier le code
            </button>
          </>
        )}
        <div className="note">Quand l&apos;un de vous passe Premium, l&apos;autre est débloqué automatiquement.</div>
      </section>

      <button className="btn ghost full" type="button" onClick={logout}>Se déconnecter</button>
    </>
  );
}
