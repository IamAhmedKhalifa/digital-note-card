"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { LogOut, KeyRound, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

export default function SettingsPage() {
  const router = useRouter();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  async function handleLogout() {
    setLogoutLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }

    setPasswordLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
    }
    setPasswordLoading(false);
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "delete") return;
    setDeleteLoading(true);

    const supabase = createClient();
    // Delete user's data (books cascade to cards via FK)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("books").delete().eq("user_id", user.id);
    }

    // Sign out (account deletion requires server-side admin API in Supabase)
    await supabase.auth.signOut();
    alert(
      "Your data has been deleted and you have been signed out. Contact support to fully remove your authentication account."
    );
    router.push("/login");
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-xl font-semibold text-nc-charcoal mb-6">Settings</h1>

      <div className="flex flex-col gap-3">
        {/* Change password */}
        <button
          onClick={() => setPasswordOpen(true)}
          className="flex items-center gap-4 p-4 bg-nc-surface rounded-2xl border border-nc-grey hover:border-nc-green/40 transition-all text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-nc-green/10 flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-nc-green" />
          </div>
          <div>
            <p className="text-sm font-semibold text-nc-charcoal">Change password</p>
            <p className="text-xs text-nc-charcoal/50 mt-0.5">Update your account password</p>
          </div>
        </button>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          disabled={logoutLoading}
          className="flex items-center gap-4 p-4 bg-nc-surface rounded-2xl border border-nc-grey hover:border-nc-green/40 transition-all text-left disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-xl bg-nc-charcoal/5 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-nc-charcoal/60" />
          </div>
          <div>
            <p className="text-sm font-semibold text-nc-charcoal">Sign out</p>
            <p className="text-xs text-nc-charcoal/50 mt-0.5">Sign out of your account</p>
          </div>
        </button>

        {/* Delete account */}
        <button
          onClick={() => setDeleteOpen(true)}
          className="flex items-center gap-4 p-4 bg-red-50 rounded-2xl border border-red-200 hover:border-red-400 transition-all text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-red-600">Delete account</p>
            <p className="text-xs text-red-400 mt-0.5">
              Permanently delete all your data
            </p>
          </div>
        </button>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <p className="text-xs text-nc-charcoal/30">
          Digital Note Card by{" "}
          <a
            href="https://northchapter.co"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            North Chapter
          </a>
        </p>
        <p className="text-xs text-nc-charcoal/20 mt-1">Read with direction</p>
      </div>

      {/* Change password modal */}
      <Modal
        open={passwordOpen}
        onClose={() => {
          setPasswordOpen(false);
          setPasswordError("");
          setPasswordSuccess(false);
        }}
        title="Change password"
      >
        {passwordSuccess ? (
          <div className="text-center py-4">
            <p className="text-sm text-nc-green font-medium">Password updated!</p>
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => {
                setPasswordOpen(false);
                setPasswordSuccess(false);
              }}
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <Input
              label="New password"
              type="password"
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <Input
              label="Confirm new password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {passwordError && (
              <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                {passwordError}
              </p>
            )}
            <Button type="submit" fullWidth loading={passwordLoading}>
              Update password
            </Button>
          </form>
        )}
      </Modal>

      {/* Delete account modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete account">
        <p className="text-sm text-nc-charcoal/70 mb-4">
          This will permanently delete all your books and cards. This cannot be
          undone.
        </p>
        <p className="text-sm text-nc-charcoal mb-2">
          Type <strong>delete</strong> to confirm:
        </p>
        <Input
          placeholder="delete"
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
        />
        <div className="flex flex-col gap-3 mt-4">
          <Button
            variant="danger"
            fullWidth
            disabled={deleteConfirm !== "delete"}
            loading={deleteLoading}
            onClick={handleDeleteAccount}
          >
            Delete everything
          </Button>
          <Button variant="ghost" fullWidth onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
