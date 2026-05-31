import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Lock, Save } from "lucide-react";
import { userService } from "@/services/userService";
import { toast } from "sonner";

export const ChangePasswordPage = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async () => {
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match");
      return;
    }

    if (newPassword === currentPassword) {
      setError("New password must be different from current password");
      return;
    }

    setLoading(true);
    try {
      await userService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const PasswordInput = ({
    label,
    value,
    onChange,
    show,
    onToggle,
    placeholder,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    show: boolean;
    onToggle: () => void;
    placeholder?: string;
  }) => (
    <div className='space-y-2'>
      <Label>{label}</Label>
      <div className='relative'>
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "••••••••"}
          className='pr-10'
        />
        <button
          type='button'
          onClick={onToggle}
          className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
        >
          {show ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
        </button>
      </div>
    </div>
  );

  return (
    <div className='space-y-6 max-w-md'>
      <div>
        <h2 className='text-xl font-bold text-foreground'>Change Password</h2>
        <p className='text-sm text-muted-foreground mt-1'>
          Update your account password.
        </p>
      </div>

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base flex items-center gap-2'>
            <Lock className='w-4 h-4' />
            Update Password
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <PasswordInput
            label='Current Password'
            value={currentPassword}
            onChange={setCurrentPassword}
            show={showCurrent}
            onToggle={() => setShowCurrent(!showCurrent)}
          />

          <PasswordInput
            label='New Password'
            value={newPassword}
            onChange={setNewPassword}
            show={showNew}
            onToggle={() => setShowNew(!showNew)}
            placeholder='Min. 6 characters'
          />

          <PasswordInput
            label='Confirm New Password'
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirm}
            onToggle={() => setShowConfirm(!showConfirm)}
          />

          {/* Password strength hint */}
          {newPassword.length > 0 && (
            <div className='space-y-1'>
              <div className='flex gap-1'>
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      newPassword.length > i * 2 + 2
                        ? newPassword.length >= 12
                          ? "bg-green-500"
                          : newPassword.length >= 8
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <p className='text-xs text-muted-foreground'>
                {newPassword.length < 6
                  ? "Too short"
                  : newPassword.length < 8
                    ? "Weak"
                    : newPassword.length < 12
                      ? "Good"
                      : "Strong"}
              </p>
            </div>
          )}

          {error && (
            <p className='text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md'>
              {error}
            </p>
          )}

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className='w-full gap-2'
          >
            <Save className='w-4 h-4' />
            {loading ? "Updating..." : "Update Password"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
