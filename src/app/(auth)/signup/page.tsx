"use client";
import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);

    // If email confirmation is disabled in Supabase, redirect straight away
    setTimeout(() => router.push("/library"), 1500);
  }

  if (success) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-nc-green mb-4">
          <span className="text-nc-warm font-bold text-lg">N</span>
        </div>
        <h2 className="text-xl font-semibold text-nc-charcoal">Account created!</h2>
        <p className="text-sm text-nc-charcoal/75 mt-2">
          Check your email to confirm your address, then sign in.
        </p>
        <Link
          href="/login"
          className="inline-block mt-6 text-sm text-nc-green font-medium underline hover:opacity-80 transition-opacity"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-nc-green mb-4">
          <span className="text-nc-warm font-bold text-lg">N</span>
        </div>
        <h1 className="text-2xl font-semibold text-nc-charcoal">Create account</h1>
        <p className="text-sm text-nc-charcoal/75 mt-1">Digital Note Card by North Chapter</p>
      </div>

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
        <Input
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        <Input
          label="Confirm password"
          type="password"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
        />

        {error && (
          <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" fullWidth loading={loading} size="lg">
          Create account
        </Button>
      </form>

      <p className="text-center text-sm text-nc-charcoal/75 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-nc-green font-medium underline hover:opacity-80 transition-opacity">
          Sign in
        </Link>
      </p>
    </div>
  );
}
