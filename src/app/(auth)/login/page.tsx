"use client";
import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push("/library");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo / brand */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-nc-green mb-4">
          <span className="text-nc-warm font-bold text-lg">N</span>
        </div>
        <h1 className="text-2xl font-semibold text-nc-charcoal">Digital Note Card</h1>
        <p className="text-sm text-nc-charcoal/75 mt-1">Read with direction</p>
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
        <div>
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <div className="flex justify-end mt-1.5">
            <Link
              href="/forgot-password"
              className="text-xs text-nc-green underline hover:opacity-80 transition-opacity"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <Button type="submit" fullWidth loading={loading} size="lg">
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-nc-charcoal/75 mt-6">
        No account?{" "}
        <Link href="/signup" className="text-nc-green font-medium underline hover:opacity-80 transition-opacity">
          Create one
        </Link>
      </p>

      <p className="text-center text-xs text-nc-charcoal/75 mt-8">
        A{" "}
        <a
          href="https://northchapter.co"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:opacity-80 transition-opacity"
        >
          North Chapter
        </a>{" "}
        product
      </p>
    </div>
  );
}
