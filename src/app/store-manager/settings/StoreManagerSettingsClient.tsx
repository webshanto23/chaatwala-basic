"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InputGroup, InputGroupInput, InputGroupAddon } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { changePassword } from "@/app/actions/password";

type StoreManagerSettingsClientProps = {
  userName: string | null;
  userEmail: string | null;
};

export default function StoreManagerSettingsClient({ userName, userEmail }: StoreManagerSettingsClientProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isChanging, setIsChanging] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChanging(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    const formData = new FormData();
    formData.append("currentPassword", currentPassword);
    formData.append("newPassword", newPassword);

    const result = await changePassword(formData);

    if (result.success) {
      setPasswordSuccess(result.message || "Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
    } else {
      setPasswordError(result.error || "Something went wrong.");
    }

    setIsChanging(false);
  };

  return (
    <Card className="border-border/70 bg-card shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <CardHeader className="px-4 pb-2 pt-4">
        <CardTitle className="text-base">Change Password</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <form className="space-y-3" onSubmit={handleChangePassword}>
          {passwordError && (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {passwordError}
            </p>
          )}
          {passwordSuccess && (
            <p className="rounded-md border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
              {passwordSuccess}
            </p>
          )}

          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Signed in as</p>
            <p className="text-sm text-muted-foreground">
              {userName ?? "Store Manager"} ({userEmail})
            </p>
          </div>

          <InputGroup>
            <InputGroupInput
              placeholder="Current password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <InputGroupAddon align="inline-start">
              <Lock />
            </InputGroupAddon>
          </InputGroup>

          <InputGroup>
            <InputGroupInput
              placeholder="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
            <InputGroupAddon align="inline-start">
              <Lock />
            </InputGroupAddon>
          </InputGroup>

          <Button className="w-full" size="sm" type="submit" disabled={isChanging}>
            {isChanging ? "Changing..." : "Change Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
