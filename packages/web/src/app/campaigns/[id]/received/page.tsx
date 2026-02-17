"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ReceivedGift {
  id: string;
  amount: number;
  comment: string;
  createdAt: string;
}

export default function ReceivedGiftsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { data: gifts, isError, error } = useQuery({
    queryKey: ["received-gifts", id],
    queryFn: () => apiFetch<ReceivedGift[]>(`/campaigns/${id}/gifts/received`),
    enabled: !!user,
  });

  const total = gifts?.reduce((sum, g) => sum + g.amount, 0) || 0;

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href={`/campaigns/${id}`}>
            <Button variant="ghost" size="sm">&larr; Back</Button>
          </Link>
          <h1 className="text-xl font-bold">Received Gifts</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {gifts && gifts.length > 0 && (
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border-2 border-orange-100">
            <p className="text-4xl mb-2">&#127881;</p>
            <p className="text-2xl font-bold text-orange-600">
              ${(total / 100).toFixed(2)}
            </p>
            <p className="text-muted-foreground">
              from {gifts.length} gift{gifts.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {gifts?.map((gift) => (
            <Card key={gift.id} className="border-2 border-orange-50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl">&#127873;</span>
                  <span className="text-xl font-bold text-orange-600">
                    ${(gift.amount / 100).toFixed(2)}
                  </span>
                </div>
                <p className="text-gray-700 italic">&ldquo;{gift.comment}&rdquo;</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(gift.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {(!gifts || gifts.length === 0) && (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">&#127873;</p>
            <p className="text-muted-foreground">No gifts received yet. Stay tuned!</p>
          </div>
        )}
      </main>
    </div>
  );
}
