"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Report = {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  post_id: string;
  posts: { title: string } | null;
};

export default function AdminReportsTable({ reports }: { reports: Report[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function resolve(reportId: string) {
    setBusyId(reportId);
    await supabase.from("reports").update({ status: "resolved" }).eq("id", reportId);
    setBusyId(null);
    router.refresh();
  }

  if (reports.length === 0) {
    return (
      <p className="font-body text-grey text-sm">
        No open reports — nothing needs your attention right now.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border">
      {reports.map((report) => (
        <div
          key={report.id}
          className="py-4 flex flex-wrap items-center justify-between gap-3"
        >
          <div>
            <Link
              href={`/posts/${report.post_id}`}
              className="font-body font-medium text-ink hover:text-accent"
            >
              {report.posts?.title ?? "(post removed)"}
            </Link>
            <p className="font-body text-sm text-grey-dark mt-1">
              &ldquo;{report.reason}&rdquo;
            </p>
            <div className="font-meta text-xs text-grey mt-1">
              Reported {new Date(report.created_at).toLocaleDateString()}
            </div>
          </div>
          <button
            onClick={() => resolve(report.id)}
            disabled={busyId === report.id}
            className="font-body text-sm text-ink hover:underline disabled:opacity-50"
          >
            Mark resolved
          </button>
        </div>
      ))}
    </div>
  );
}
