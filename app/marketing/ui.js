"use client";

// Shared pieces for the /marketing page: toast, clipboard + download helpers,
// the saved-assets context, and the Copy / Save buttons used on every card.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

// ---- clipboard + download -------------------------------------------------

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export function downloadFile(filename, content, mime = "text/plain") {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---- toast ----------------------------------------------------------------

export const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastHost({ children }) {
  const [msg, setMsg] = useState(null);
  const timer = useRef(null);
  const show = useCallback((text, tone = "ok") => {
    setMsg({ text, tone });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2600);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-[70] flex justify-center px-4"
      >
        {msg && (
          <div
            className={`rise rounded-full px-5 py-3 text-sm font-semibold shadow-pop ${
              msg.tone === "error" ? "bg-danger text-white" : "bg-ink text-white"
            }`}
          >
            {msg.text}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

// ---- saved assets (Supabase marketing_assets) -----------------------------

export const AssetsContext = createContext(null);
export const useAssets = () => useContext(AssetsContext);

function isMissingTable(error) {
  const text = `${error?.code || ""} ${error?.message || ""}`;
  return /PGRST205|42P01|schema cache|does not exist/i.test(text);
}

export const SETUP_HINT =
  "The marketing_assets table is not in Supabase yet. Run supabase_marketing.sql once in the Supabase SQL editor.";

export function AssetsProvider({ children }) {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from("marketing_assets")
        .select("*")
        .order("created_at", { ascending: false });
      if (err) {
        setError(isMissingTable(err) ? SETUP_HINT : err.message);
        setSaved([]);
      } else {
        setError(null);
        setSaved(data || []);
      }
    } catch (e) {
      setError(String(e?.message || e));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isSaved = useCallback(
    (a) => saved.some((s) => s.asset_type === a.asset_type && s.title === a.title && s.body === a.body),
    [saved]
  );

  const save = useCallback(
    async (asset) => {
      if (isSaved(asset)) {
        toast("Already saved");
        return;
      }
      const { data, error: err } = await supabase
        .from("marketing_assets")
        .insert({
          asset_type: asset.asset_type,
          title: asset.title,
          channel: asset.channel ?? null,
          day_number: asset.day_number ?? null,
          body: asset.body,
        })
        .select()
        .single();
      if (err) {
        const text = isMissingTable(err) ? SETUP_HINT : `Could not save: ${err.message}`;
        setError(isMissingTable(err) ? SETUP_HINT : null);
        toast(text, "error");
        return;
      }
      setError(null);
      setSaved((prev) => [data, ...prev]);
      toast("Saved to your marketing assets");
    },
    [isSaved, toast]
  );

  const remove = useCallback(
    async (id) => {
      const { error: err } = await supabase.from("marketing_assets").delete().eq("id", id);
      if (err) {
        toast(`Could not delete: ${err.message}`, "error");
        return;
      }
      setSaved((prev) => prev.filter((s) => s.id !== id));
      toast("Deleted");
    },
    [toast]
  );

  return (
    <AssetsContext.Provider value={{ saved, loading, error, save, remove, isSaved, refresh }}>
      {children}
    </AssetsContext.Provider>
  );
}

// ---- buttons ---------------------------------------------------------------

export function CopyButton({ text, label = "Copy", className = "" }) {
  const toast = useToast();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={`btn-ghost btn-sm ${className}`}
      onClick={async () => {
        const ok = await copyText(text);
        if (ok) {
          setDone(true);
          toast("Copied to clipboard");
          setTimeout(() => setDone(false), 1600);
        } else {
          toast("Copy failed. Select the text and copy manually.", "error");
        }
      }}
    >
      {done ? "Copied ✓" : label}
    </button>
  );
}

export function SaveButton({ asset, className = "" }) {
  const { save, isSaved } = useAssets();
  const [busy, setBusy] = useState(false);
  const saved = isSaved(asset);
  return (
    <button
      type="button"
      disabled={busy}
      className={`btn-dark btn-sm ${saved ? "!bg-ok" : ""} ${className}`}
      onClick={async () => {
        setBusy(true);
        await save(asset);
        setBusy(false);
      }}
    >
      {saved ? "Saved ✓" : busy ? "Saving..." : "Save"}
    </button>
  );
}

// ---- layout helpers --------------------------------------------------------

export function Section({ id, num, title, children, intro }) {
  return (
    <section id={id} className="scroll-mt-36 border-b border-line py-14 last:border-b-0">
      <div className="mb-8 max-w-3xl">
        <p className="eyebrow">Section {num}</p>
        <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">{title}</h2>
        {intro && <p className="mt-3 text-muted">{intro}</p>}
      </div>
      {children}
    </section>
  );
}

export function Badge({ children, tone = "default" }) {
  const tones = {
    default: "bg-paper-2 text-ink-soft",
    brand: "bg-brand-soft text-brand-dark",
    navy: "bg-navy text-white",
    sun: "bg-sun/60 text-ink",
    ok: "bg-ok/15 text-ok",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${tones[tone]}`}>
      {children}
    </span>
  );
}
