"use client";

// Floating "Need help?" button (bottom right) that opens the same rule-based
// assistant as /chat inside a small panel. It stays mounted after the first
// open so the conversation is not lost when the panel is closed.

import { useState } from "react";
import { usePathname } from "next/navigation";
import ChatApp from "@/app/chat/ChatApp";

export default function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);

  // /chat already is the full chat, so no second one there
  if (pathname === "/chat") return null;

  function toggle() {
    setOpen((v) => !v);
    setEverOpened(true);
  }

  return (
    <>
      {everOpened && (
        <div
          role="dialog"
          aria-label="Lost and found assistant"
          aria-hidden={!open}
          className={`fixed bottom-24 right-4 z-50 flex h-[min(36rem,calc(100vh-8rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border-2 border-ink bg-surface shadow-[6px_6px_0_0_rgba(15,23,42,0.9)] sm:right-6 ${open ? "" : "hidden"}`}
        >
          <div className="flex items-center justify-between gap-2 border-b-2 border-ink bg-navy px-4 py-3 text-white">
            <div>
              <p className="font-display text-sm font-bold leading-tight">Lost and found help</p>
              <p className="text-[11px] opacity-80">Automated assistant</p>
            </div>
            <button
              type="button"
              onClick={toggle}
              aria-label="Close chat"
              className="rounded-full px-2 py-1 text-xl leading-none hover:bg-white/15"
            >
              ×
            </button>
          </div>
          <div className="min-h-0 flex-1">
            <ChatApp compact />
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-label={open ? "Close chat" : "Open chat: need help?"}
        className="btn-primary fixed bottom-5 right-4 z-50 !rounded-full px-5 py-3 shadow-lg sm:right-6"
      >
        <span aria-hidden="true">{open ? "×" : "💬"}</span> {open ? "Close" : "Need help?"}
      </button>
    </>
  );
}
