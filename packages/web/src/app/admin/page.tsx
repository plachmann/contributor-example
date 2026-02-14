"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Link from "next/link";

interface Campaign {
  id: string;
  title: string;
  budgetPerUser: number;
  openDate: string;
  closeDate: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [openDate, setOpenDate] = useState("");
  const [closeDate, setCloseDate] = useState("");

  const { data: campaigns } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => apiFetch<Campaign[]>("/campaigns"),
    enabled: !!user?.isAdmin,
  });

  const createCampaign = useMutation({
    mutationFn: (data: object) =>
      apiFetch("/campaigns", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setTitle("");
      setDescription("");
      setBudget("");
      setOpenDate("");
      setCloseDate("");
      toast.success("Campaign created!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">&larr; Dashboard</Button>
          </Link>
          <h1 className="text-xl font-bold">Admin</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Create Campaign</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="desc">Description</Label>
              <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="budget">Budget per user ($)</Label>
                <Input id="budget" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="open">Open date</Label>
                <Input id="open" type="date" value={openDate} onChange={(e) => setOpenDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="close">Close date</Label>
                <Input id="close" type="date" value={closeDate} onChange={(e) => setCloseDate(e.target.value)} />
              </div>
            </div>
            <Button
              onClick={() =>
                createCampaign.mutate({
                  title,
                  description: description || undefined,
                  budgetPerUser: Math.round(parseFloat(budget) * 100),
                  openDate: new Date(openDate).toISOString(),
                  closeDate: new Date(closeDate).toISOString(),
                })
              }
              disabled={!title || !budget || !openDate || !closeDate}
            >
              Create Campaign
            </Button>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-lg font-semibold mb-4">All Campaigns</h2>
          <div className="space-y-3">
            {campaigns?.map((c) => (
              <Link key={c.id} href={`/admin/campaigns/${c.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{c.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Budget: ${(c.budgetPerUser / 100).toFixed(2)} per person
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(c.openDate).toLocaleDateString()} &mdash; {new Date(c.closeDate).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
