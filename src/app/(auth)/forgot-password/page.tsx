"use client";
import { useState, FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError(
        "Something went wrong. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo / brand */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-nc-green mb-4">
          <span className="text-nc-warm font-bold text-lg">N</span>
        </div>
        <h1 className="text-2xl font-semibold text-nc-charcoal">
          Reset password
        </h1>
        <p className="text-sm text-nc-charcoal/75 mt-1">
          We&apos;ll send you a link to get back in
        </p>
      </div>

      {sent ? (
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-nc-green/10 mb-4">
            <Mail className="w-6 h-6 text-nc-green" />
          </div>
          <p className="text-sm text-nc-charcoal leading-relaxed">
            We sent a reset link to{" "}
            <span className="font-medium">{email}</span>. Check your inbox
            &mdash; if you don&apos;t see it, check your spam folder.
          </p>
          <p className="text-xs text-nc-charcoal/75 mt-3 leading-relaxed">
            Didn&apos;t get the email? Wait a minute, then{" "}
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setError("");
              }}
              className="text-nc-green underline hover:opacity-80 transition-opacity"
            >
              try again
            </button>
            .
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-nc-green font-medium underline mt-6 hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            {error && (
              <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                <p>{error}</p>
                <p className="text-xs text-red-700/80 mt-1">
                  If this keeps happening, make sure the reset URL is added to
                  your Supabase project&apos;s redirect allowlist.
                </p>
              </div>
            )}

            <Button type="submit" fullWidth loading={loading} size="lg">
              Send reset link
            </Button>
          </form>

          <p className="text-center text-sm text-nc-charcoal/75 mt-6">
            <Link
              href="/login"
              className="text-nc-green font-medium underline hover:opacity-80 transition-opacity"
            >
              Back to login
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
