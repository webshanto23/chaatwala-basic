"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

import { EditProfileModal } from "@/components/account/EditProfileModal";
import { AddressList } from "@/components/account/AddressList";
import { NotificationSettings } from "@/components/account/NotificationSettings";
import { ProfileHeader } from "@/components/account/ProfileHeader";
import { SecuritySection } from "@/components/account/SecuritySection";
import { SettingsList } from "@/components/account/SettingsList";
import { useUserData } from "@/contexts/auth-context";

export default function UserDashboard() {
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [offers, setOffers] = useState(true);
  const [emailSms, setEmailSms] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const { data: session } = useSession();
  const { profile, isLoading, refresh } = useUserData();

  const name = profile?.name ?? session?.user?.name ?? "Ava Carter";
  const email = profile?.email ?? session?.user?.email ?? "ava.carter@example.com";
  const image = profile?.image ?? session?.user?.image ?? "";
  const phone = profile?.phone ?? "";

  const handleProfileUpdated = async () => {
    await refresh();
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-[480px] flex-col gap-4">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            My Account
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            Personal settings
          </h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <ProfileHeader
              name={name}
              email={email}
              phone={phone}
              image={image}
            />
            <SettingsList onEditProfile={() => setEditProfileOpen(true)} />
            <AddressList />
            <NotificationSettings
              orderUpdates={orderUpdates}
              offers={offers}
              emailSms={emailSms}
              onOrderUpdatesChange={() => setOrderUpdates((value) => !value)}
              onOffersChange={() => setOffers((value) => !value)}
              onEmailSmsChange={() => setEmailSms((value) => !value)}
            />
            <SecuritySection />
          </>
        )}

        <EditProfileModal
          open={editProfileOpen}
          onOpenChange={(open) => {
            setEditProfileOpen(open);
            if (!open) {
              handleProfileUpdated();
            }
          }}
          initialName={name}
          initialImage={image}
        />
      </div>
    </div>
  );
}
