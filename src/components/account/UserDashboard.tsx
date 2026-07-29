"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";

import { EditProfileModal } from "@/components/account/EditProfileModal";
import { AddressList } from "@/components/account/AddressList";
import { NotificationSettings } from "@/components/account/NotificationSettings";
import { ProfileHeader } from "@/components/account/ProfileHeader";
import { SecuritySection } from "@/components/account/SecuritySection";
import { SettingsList } from "@/components/account/SettingsList";

export default function UserDashboard() {
  const [orderUpdates, setOrderUpdates] = useState(true);
  const [offers, setOffers] = useState(true);
  const [emailSms, setEmailSms] = useState(false);
  const [profileData, setProfileData] = useState<{
    name: string;
    email: string;
    image: string;
    phone: string;
  } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const { data: session, update } = useSession();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/user/profile", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setProfileData({
            name: data.user.name ?? "",
            email: data.user.email ?? "",
            image: data.user.image ?? "",
            phone: data.phone ?? "",
          });
        }
      } catch {
        // keep defaults
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const name = profileData?.name ?? session?.user?.name ?? "Ava Carter";
  const email = profileData?.email ?? session?.user?.email ?? "ava.carter@example.com";
  const image = profileData?.image ?? session?.user?.image ?? "";
  const phone = profileData?.phone ?? "";

  const handleProfileUpdated = async () => {
    const res = await fetch("/api/user/profile", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setProfileData({
        name: data.user.name ?? "",
        email: data.user.email ?? "",
        image: data.user.image ?? "",
        phone: data.phone ?? "",
      });
    }
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

        {profileLoading ? (
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