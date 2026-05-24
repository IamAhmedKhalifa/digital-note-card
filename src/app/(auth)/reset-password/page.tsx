"use client";
import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      router.push("/library");
      router.refresh();
    } catch {
      setError(
        "Something went wrong. Please check your connection and try again."
      );
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
          Set new password
        </h1>
        <p className="text-sm text-nc-charcoal/75 mt-1">
          Choose a strong password for your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="New password"
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
          placeholder="Re-enter your password"
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
          Reset password
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
    </div>
  );
}
