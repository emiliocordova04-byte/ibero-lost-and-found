"use client";

// Public guided assistant. All conversation rules live in lib/chatLogic.mjs
// (a rule-based state machine). This file only renders the
// messages, saves the confirmed report and the rating to Supabase.

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { startChat, nextTurn, buildSessionRow, validateRating, RATING_COPY } from "@/lib/chatLogic.mjs";

function Bubble({ m }) {
  const mine = m.role === "user";
  const tone =
    m.kind === "guardrail"
      ? "border-sun bg-sun/25"
      : m.kind === "confirm"
        ? "border-navy bg-surface"
        : m.kind === "handoff"
          ? "border-navy bg-paper-2"
          : mine
            ? "border-ink bg-ink text-white"
            : "border-line-strong bg-surface";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-line rounded-2xl border px-4 py-3 text-sm leading-relaxed ${tone}`}
      >
        {m.kind === "guardrail" && (
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
            Guardrail
          </span>
        )}
        {m.kind === "confirm" && m.card ? <ConfirmCard card={m.card} /> : m.text}
      </div>
    </div>
  );
}

function ConfirmCard({ card }) {
  return (
    <div>
      <p className="font-semibold">{card.title}</p>
      <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5">
        {card.rows.map((r) => (
          <div key={r.label} className="contents">
            <dt className="text-xs font-semibold uppercase tracking-wider text-muted-2">{r.label}</dt>
            <dd className="font-medium">{r.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 inline-block rounded-full border border-line-strong bg-paper-2 px-3 py-1 text-xs font-semibold">
        {card.status}
      </p>
      {card.priorityNote && <p className="mt-2 text-xs text-ink-soft">{card.priorityNote}</p>}
      <p className="mt-3 font-semibold">{card.ask}</p>
    </div>
  );
}

export default function ChatApp({ compact = false }) {
  const first = useMemo(() => startChat("en"), []);
  const [chat, setChat] = useState(first.state);
  const [messages, setMessages] = useState(() => first.replies.map((r) => ({ ...r, role: "bot" })));
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [rated, setRated] = useState(false);
  const [comment, setComment] = useState("");
  const [note, setNote] = useState("");
  const [askWhy, setAskWhy] = useState(false);
  const [testTag, setTestTag] = useState(null);
  const endRef = useRef(null);

  useEffect(() => {
    if (compact) return; // the floating widget is never part of a user test
    try {
      const tag = new URLSearchParams(window.location.search).get("test");
      if (tag) setTestTag(tag.slice(0, 20));
    } catch {}
  }, [compact]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sessionId, rated]);

  const lastBot = [...messages].reverse().find((m) => m.role === "bot");
  const chips = lastBot?.chips || [];

  async function send(raw) {
    const text = String(raw ?? input).trim();
    if (!text || busy) return;
    setInput("");
    setNote("");
    const userMsg = { role: "user", kind: "user", text };
    const result = nextTurn(chat, text);
    const botMsgs = result.replies.map((r) => ({ ...r, role: "bot" }));
    const transcript = [...messages, userMsg, ...botMsgs];

    if (result.save) {
      setBusy(true);
      setMessages([...messages, userMsg]);
      const row = buildSessionRow(result.state, { testTag, transcript });
      const { data, error } = await supabase.from("chat_sessions").insert(row).select("id").single();
      setBusy(false);
      if (error || !data) {
        setMessages([
          ...messages,
          userMsg,
          {
            role: "bot",
            kind: "bot",
            text: "I could not save your report because the connection failed. Nothing was sent. Please press Yes again in a moment.",
            chips: [chat.lang === "es" ? "Sí, enviarlo" : "Yes, send it"],
          },
        ]);
        return;
      }
      setSessionId(data.id);
      setChat(result.state);
      setMessages(transcript);
      return;
    }

    setChat(result.state);
    setMessages(transcript);
    if (chat.saved && !result.state.saved) {
      setSessionId(null);
      setRated(false);
      setAskWhy(false);
      setComment("");
    }
  }

  async function rate(value, reason = "") {
    const text = [reason, comment.trim()].filter(Boolean).join(": ");
    const check = validateRating(value, text);
    if (!check.ok || !sessionId || rated) return;
    setBusy(true);
    const { error } = await supabase
      .from("chat_sessions")
      .update({ rating: check.rating, feedback: check.comment || null })
      .eq("id", sessionId);
    setBusy(false);
    if (error) {
      setNote("Could not save your rating. Please try again.");
      return;
    }
    setRated(true);
    setAskWhy(false);
    const rc = RATING_COPY[chat.lang] || RATING_COPY.en;
    setNote(check.rating === "down" ? `${rc.thanksDown} ${rc.contactNote}` : rc.thanksUp);
  }

  const saved = chat.step === "done" && sessionId;

  return (
    <div className={compact ? "flex h-full flex-col" : "mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12"}>
      {!compact && (
        <>
          <p className="eyebrow">Week 5 · Guided assistant</p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Report a lost or found item</h1>
          <p className="mt-3 max-w-2xl text-muted">
            Three short questions, then a summary you confirm. A staff member reviews every report. Works in English and
            Spanish.
          </p>
        </>
      )}

      <section
        className={compact ? "flex min-h-0 flex-1 flex-col overflow-hidden bg-surface" : "card mt-6 overflow-hidden"}
        aria-label="Chat with the lost and found assistant"
      >
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b border-line bg-paper-2 px-4 py-3 ${compact ? "hidden" : ""}`}>
          <span className="font-display text-sm font-bold">Lost-item assistant</span>
          <span className="chip">Automated assistant</span>
        </div>

        <div
          className={`space-y-3 overflow-y-auto px-4 py-4 ${compact ? "min-h-0 flex-1" : "h-[min(28rem,calc(100vh-31rem))] min-h-[14rem]"}`}
          role="log"
          aria-live="polite"
        >
          {messages.map((m, i) => (
            <Bubble key={i} m={m} />
          ))}

          {saved && (
            <div className="rounded-2xl border border-line-strong bg-paper p-4 text-sm">
              <p className="font-semibold">{rated ? note : "Was this helpful?"}</p>
              {!rated && (
                <>
                  <textarea
                    className="field mt-3 h-20 resize-none"
                    maxLength={300}
                    placeholder="Optional comment (max 300 characters). Please do not include phone numbers or emails."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    aria-label="Optional comment"
                  />
                  <div className="mt-3 flex gap-2">
                    <button type="button" className="btn-ghost btn-sm" disabled={busy} onClick={() => rate("up")}>
                      <span aria-hidden="true">👍</span> Thumbs up
                    </button>
                    <button type="button" className="btn-ghost btn-sm" disabled={busy} onClick={() => setAskWhy(true)}>
                      <span aria-hidden="true">👎</span> Thumbs down
                    </button>
                  </div>
                  {askWhy && (
                    <div className="mt-3 rounded-xl border border-line-strong bg-surface p-3">
                      <p className="font-semibold">{(RATING_COPY[chat.lang] || RATING_COPY.en).askWhy}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(RATING_COPY[chat.lang] || RATING_COPY.en).reasons.map((r) => (
                          <button key={r} type="button" className="chip hover:border-ink" disabled={busy} onClick={() => rate("down", r)}>
                            {r}
                          </button>
                        ))}
                      </div>
                      <p className="mt-3 text-xs text-ink-soft">{(RATING_COPY[chat.lang] || RATING_COPY.en).contactNote}</p>
                    </div>
                  )}
                  {note && <p className="mt-2 text-danger">{note}</p>}
                </>
              )}
            </div>
          )}
          <div ref={endRef} />
        </div>

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
            {chips.map((c) => (
              <button key={c} type="button" className="chip hover:border-ink" onClick={() => send(c)} disabled={busy}>
                {c}
              </button>
            ))}
          </div>
        )}

        <form
          className="flex gap-2 border-t border-line bg-paper-2 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <input
            className="field"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={400}
            aria-label="Your message"
            autoComplete="off"
          />
          <button type="submit" className="btn-primary" disabled={busy || !input.trim()}>
            Send
          </button>
        </form>
        {compact && (
          <p className="border-t border-line bg-paper-2 px-3 pb-2 text-[11px] leading-snug text-muted-2">
            Do not share phone numbers, emails or ID numbers. They are removed before saving.
          </p>
        )}
      </section>

      {!compact && (
      <div className="mt-4 space-y-1 text-xs text-muted-2">
        <p>
          Do not share phone numbers, emails or ID numbers in this chat. They are removed before anything is saved.
          Every confirmed report is read by Student Services staff.
        </p>
        <p>
          Staff and test summary: <a className="underline hover:text-brand" href="/chat/results">/chat/results</a>
        </p>
      </div>
      )}
    </div>
  );
}
