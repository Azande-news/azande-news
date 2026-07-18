"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  username: string;
  display_name: string;
  role: string;
  created_at: string;
};

export default function AdminUsersTable({
  profiles,
  currentUserId,
}: {
  profiles: Profile[];
  currentUserId: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggleRole(profile: Profile) {
    setBusyId(profile.id);
    const nextRole = profile.role === "admin" ? "member" : "admin";
    await supabase.from("profiles").update({ role: nextRole }).eq("id", profile.id);
    setBusyId(null);
    router.refresh();
  }

  return (
    <div className="divide-y divide-forest/10">
      {profiles.map((profile) => (
        <div
          key={profile.id}
          className="py-4 flex flex-wrap items-center justify-between gap-3"
        >
          <div>
            <span className="font-body font-medium text-forest">
              {profile.display_name}
            </span>{" "}
            <span className="font-meta text-xs text-forest/60">
              @{profile.username} &middot; {profile.role}
            </span>
          </div>
          {profile.id !== currentUserId && (
            <button
              onClick={() => toggleRole(profile)}
              disabled={busyId === profile.id}
              className="font-body text-sm text-forest hover:underline disabled:opacity-50"
            >
              {profile.role === "admin" ? "Remove admin" : "Make admin"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
