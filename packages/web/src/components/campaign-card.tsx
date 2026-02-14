"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface CampaignCardProps {
  campaign: {
    id: string;
    title: string;
    description: string | null;
    budgetPerUser: number;
    openDate: string;
    closeDate: string;
    totalGifted: number;
    remainingBudget: number;
  };
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const now = new Date();
  const closeDate = new Date(campaign.closeDate);
  const openDate = new Date(campaign.openDate);
  const isOpen = now >= openDate && now <= closeDate;
  const spent = campaign.totalGifted;
  const budget = campaign.budgetPerUser;
  const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;
  const daysLeft = Math.max(0, Math.ceil((closeDate.getTime() - now.getTime()) / 86400000));

  return (
    <Link href={`/campaigns/${campaign.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-orange-300">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{campaign.title}</CardTitle>
            <Badge variant={isOpen ? "default" : "secondary"}>
              {isOpen ? "Open" : "Closed"}
            </Badge>
          </div>
          {campaign.description && (
            <p className="text-sm text-muted-foreground">{campaign.description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">
                ${(campaign.remainingBudget / 100).toFixed(2)} remaining
              </span>
              <span className="text-muted-foreground">
                of ${(budget / 100).toFixed(2)}
              </span>
            </div>
            <Progress value={percentUsed} className="h-3" />
          </div>
          {isOpen && (
            <p className="text-sm text-muted-foreground">
              {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
