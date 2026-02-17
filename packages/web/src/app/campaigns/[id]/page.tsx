"use client";

import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { fireConfetti } from "@/lib/confetti";
import { BudgetMeter } from "@/components/budget-meter";
import { CoworkerPicker } from "@/components/coworker-picker";
import { GiftForm } from "@/components/gift-form";
import { GiftCard } from "@/components/gift-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Campaign } from "@/lib/types";

interface Coworker {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

interface Gift {
  id: string;
  amount: number;
  comment: string;
  recipient: { id: string; displayName: string; avatarUrl: string | null };
}

export default function CampaignPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCoworker, setSelectedCoworker] = useState<string | null>(null);

  const { data: campaign, isError, error } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => apiFetch<Campaign>(`/campaigns/${id}`),
    enabled: !!user,
  });

  const { data: coworkers } = useQuery({
    queryKey: ["participants", id],
    queryFn: () => apiFetch<Coworker[]>(`/campaigns/${id}/participants`),
    enabled: !!user,
  });

  const { data: gifts } = useQuery({
    queryKey: ["gifts", id],
    queryFn: () => apiFetch<Gift[]>(`/campaigns/${id}/gifts`),
    enabled: !!user,
  });

  const isOpen = campaign
    ? new Date() >= new Date(campaign.openDate) && new Date() <= new Date(campaign.closeDate)
    : false;

  const giftedIds = new Set(gifts?.map((g) => g.recipient.id) || []);
  const selectedName = coworkers?.find((c) => c.id === selectedCoworker)?.displayName || null;
  const existingGift = gifts?.find((g) => g.recipient.id === selectedCoworker) || null;

  const onMutationSuccess = (message: string) => {
    queryClient.invalidateQueries({ queryKey: ["gifts", id] });
    queryClient.invalidateQueries({ queryKey: ["campaign", id] });
    setSelectedCoworker(null);
    fireConfetti();
    toast.success(message);
  };

  const createGift = useMutation({
    mutationFn: (data: { recipientId: string; amount: number; comment: string }) =>
      apiFetch(`/campaigns/${id}/gifts`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => onMutationSuccess("Gift sent!"),
    onError: (err: Error) => toast.error(err.message),
  });

  const updateGift = useMutation({
    mutationFn: (data: { giftId: string; amount: number; comment: string }) =>
      apiFetch(`/campaigns/${id}/gifts/${data.giftId}`, {
        method: "PUT",
        body: JSON.stringify({ amount: data.amount, comment: data.comment }),
      }),
    onSuccess: () => onMutationSuccess("Gift updated!"),
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteGift = useMutation({
    mutationFn: (giftId: string) =>
      apiFetch(`/campaigns/${id}/gifts/${giftId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gifts", id] });
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
      toast.success("Gift removed");
    },
    onError: (err: Error) => toast.error(err.message),
  });

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

  if (!campaign) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">&larr; Back</Button>
          </Link>
          <h1 className="text-xl font-bold">{campaign.title}</h1>
          <Link href={`/campaigns/${id}/received`} className="ml-auto">
            <Button variant="outline" size="sm">Received Gifts</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <BudgetMeter budget={campaign.budgetPerUser} spent={campaign.totalGifted} />

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-lg font-semibold mb-4">Coworkers</h2>
            <CoworkerPicker
              coworkers={coworkers || []}
              giftedIds={giftedIds}
              selectedId={selectedCoworker}
              onSelect={setSelectedCoworker}
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">
              {isOpen ? "Send a Gift" : "Campaign Closed"}
            </h2>
            {isOpen ? (
              <GiftForm
                key={selectedCoworker}
                recipientName={selectedName}
                remainingBudget={campaign.remainingBudget + (existingGift?.amount ?? 0)}
                initialAmount={existingGift?.amount}
                initialComment={existingGift?.comment}
                isEdit={!!existingGift}
                onSubmit={async (amount, comment) => {
                  if (!selectedCoworker) return;
                  if (existingGift) {
                    await updateGift.mutateAsync({
                      giftId: existingGift.id,
                      amount,
                      comment,
                    }).catch(() => {});
                  } else {
                    await createGift.mutateAsync({
                      recipientId: selectedCoworker,
                      amount,
                      comment,
                    }).catch(() => {});
                  }
                }}
              />
            ) : (
              <p className="text-muted-foreground">This campaign is no longer accepting gifts.</p>
            )}
          </div>
        </div>

        {gifts && gifts.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Your Gifts ({gifts.length})</h2>
            <div className="space-y-3">
              {gifts.map((gift) => (
                <GiftCard
                  key={gift.id}
                  gift={gift}
                  campaignOpen={isOpen}
                  onEdit={() => setSelectedCoworker(gift.recipient.id)}
                  onDelete={() => {
                    if (window.confirm("Are you sure you want to delete this gift?")) {
                      deleteGift.mutate(gift.id);
                    }
                  }}
                  isDeleting={deleteGift.isPending}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}