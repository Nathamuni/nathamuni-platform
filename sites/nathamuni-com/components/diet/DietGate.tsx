"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

// Free Cloudflare Turnstile bot check; the widget only appears once the site key is set at build time.
const TURNSTILE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

type Status = "idle" | "sending" | "done";

/**
 * Asks for a name and mobile number before any diet zip downloads.
 *
 * Every download link on the page carries `data-diet-gate`; a click on one opens this
 * form instead of downloading. The worker only serves a zip with the token this form's
 * POST returns, so links shared elsewhere land here too (`/diet?get=1` opens it).
 */
export function DietGate() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.("a[data-diet-gate]");
      if (!link || e.defaultPrevented) return;
      e.preventDefault();
      const href = link.getAttribute("data-diet-file");
      setFile(href);
      setOpen(true);
    };
    document.addEventListener("click", onClick);
    // A shared /diet/latest.zip link redirects here as /diet?get=1: open the form.
    if (new URLSearchParams(window.location.search).has("get")) {
      queueMicrotask(() => setOpen(true));
    }
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    nameRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
    setStatus("idle");
    setError("");
    setUrl("");
    if (window.location.search.includes("get")) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/diet/lead", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          phone: form.get("phone"),
          country: form.get("country"),
          website: form.get("website"),
          turnstile: form.get("cf-turnstile-response"),
          file,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        url?: string;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.url) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setStatus("idle");
        return;
      }
      setUrl(data.url);
      setStatus("done");
      window.location.assign(data.url);
    } catch {
      setError("Could not reach the server. Check your connection.");
      setStatus("idle");
    }
  }

  if (!open) return null;

  return (
    <div
      className="diet-gate"
      role="dialog"
      aria-modal="true"
      aria-labelledby="diet-gate-title"
      data-testid="diet-gate"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <div className="diet-gate-card">
        <button
          type="button"
          className="diet-gate-close"
          onClick={close}
          aria-label="Close"
        >
          ×
        </button>
        <h2 id="diet-gate-title" className="diet-h3">
          Before you download
        </h2>
        <p className="diet-muted">
          Tell me who is using it, so I can share updates and improve the plugin.
        </p>
        {status === "done" ? (
          <p role="status" data-testid="diet-gate-done">
            Your download is starting.{" "}
            <a href={url} className="diet-version-link">
              Tap here if it does not.
            </a>
          </p>
        ) : (
          <form onSubmit={submit} className="diet-gate-form" noValidate>
            <label>
              <span>Your name</span>
              <input
                ref={nameRef}
                name="name"
                autoComplete="name"
                required
                minLength={2}
                maxLength={60}
                data-testid="diet-gate-name"
              />
            </label>
            <label>
              <span>Mobile number</span>
              <div style={{ display: "flex", gap: 8 }}>
                <select name="country" defaultValue="91" aria-label="Country code" data-testid="diet-gate-country" style={{ flex: "0 0 96px" }}>
                  {[["91", "IN +91"], ["1", "US +1"], ["44", "UK +44"], ["971", "UAE +971"], ["65", "SG +65"], ["60", "MY +60"], ["61", "AU +61"], ["94", "LK +94"], ["966", "SA +966"], ["974", "QA +974"]].map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              <input
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="98765 43210"
                required
                maxLength={16}
                data-testid="diet-gate-phone"
              />
              </div>
            </label>
            {/* Honeypot: invisible to people, tempting to bots. */}
            <input
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="diet-gate-trap"
            />
            {TURNSTILE_KEY && (
              <>
                <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="lazyOnload" />
                <div className="cf-turnstile" data-sitekey={TURNSTILE_KEY} data-theme="light" />
              </>
            )}
            {error && (
              <p role="alert" className="diet-gate-error" data-testid="diet-gate-error">
                {error}
              </p>
            )}
            <button
              type="submit"
              className="diet-download"
              disabled={status === "sending"}
              data-testid="diet-gate-submit"
            >
              <span>{status === "sending" ? "One moment..." : "Download"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
