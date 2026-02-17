"use client";

import { useParams } from "next/navigation";
import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";

interface CampaignStatus {
  campaign: {
    id: string;
    title: string;
    budgetPerUser: number;
    openDate: string;
    closeDate: string;
  };
  participantStatus: Array<{
    user: { id: string; email: string; displayName: string };
    totalGifted: number;
    giftCount: number;
    remainingBudget: number;
  }>;
}

interface ReportSummary {
  totalParticipants: number;
  participantsWhoGifted: number;
  participationRate: number;
  totalAmountGifted: number;
  averageGiftAmount: number;
  totalGiftsCount: number;
}

export default function CampaignStatusPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const fileInput = useRef<HTMLInputElement>(null);

  const { data: status, isError, error } = useQuery({
    queryKey: ["campaign-status", id],
    queryFn: () => apiFetch<CampaignStatus>(`/campaigns/${id}/status`),
    enabled: !!user?.isAdmin,
  });

  const { data: report } = useQuery({
    queryKey: ["campaign-report", id],
    queryFn: () => apiFetch<ReportSummary>(`/campaigns/${id}/reports/summary`),
    enabled: !!user?.isAdmin,
  });

  const handleCSVUpload = async () => {
    const file = fileInput.current?.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

    try {
      const res = await fetch(`${apiUrl}/campaigns/${id}/participants/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const result = await res.json();

      if (res.ok) {
        toast.success(`Added ${result.participantsAdded} participants`);
      } else {
        toast.error(result.error || "Upload failed");
      }
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <div className="text-center">
          <p className="text-destructive font-medium">Something went wrong</p>
          <p className="text-sm text-muted-foreground mt-1">{error?.message}</p>
        </div>
      </div>
    );
  }

  if (!status) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="sm">&larr; Admin</Button>
          </Link>
          <h1 className="text-xl font-bold">{status.campaign.title}</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {report && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Participation", value: `${Math.round(report.participationRate * 100)}%` },
              { label: "Total Gifted", value: `$${(report.totalAmountGifted / 100).toFixed(2)}` },
              { label: "Total Gifts", value: report.totalGiftsCount.toString() },
              { label: "Avg Gift", value: `$${(report.averageGiftAmount / 100).toFixed(2)}` },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-orange-600">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Import Participants</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4 items-end">
            <div className="flex-1">
              <Input ref={fileInput} type="file" accept=".csv" />
              <p className="text-xs text-muted-foreground mt-1">CSV format: email,display_name</p>
            </div>
            <Button onClick={handleCSVUpload}>Upload</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participant Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {status.participantStatus.map((p) => {
                const pct =
                  status.campaign.budgetPerUser > 0
                    ? (p.totalGifted / status.campaign.budgetPerUser) * 100
                    : 0;
                return (
                  <div key={p.user.id} className="flex items-center gap-4">
                    <div className="w-48 truncate">
                      <p className="font-medium text-sm">{p.user.displayName}</p>
                      <p className="text-xs text-muted-foreground">{p.user.email}</p>
                    </div>
                    <div className="flex-1">
                      <Progress value={pct} className="h-2" />
                    </div>
                    <div className="w-32 text-right text-sm">
                      ${(p.totalGifted / 100).toFixed(2)} / ${(status.campaign.budgetPerUser / 100).toFixed(2)}
                    </div>
                    <div className="w-16 text-right text-sm text-muted-foreground">
                      {p.giftCount} gift{p.giftCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
