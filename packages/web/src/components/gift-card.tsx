"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface GiftCardProps {
  gift: {
    id: string;
    amount: number;
    comment: string;
    recipient: {
      id: string;
      displayName: string;
      avatarUrl: string | null;
    };
  };
  onEdit: () => void;
  onDelete: () => void;
  campaignOpen: boolean;
  isDeleting?: boolean;
}

export function GiftCard({ gift, onEdit, onDelete, campaignOpen, isDeleting }: GiftCardProps) {
  return (
    <Card className="border-2 border-orange-50">
      <CardContent className="flex items-center gap-4 p-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src={gift.recipient.avatarUrl || undefined} />
          <AvatarFallback className="bg-orange-200 text-orange-700">
            {gift.recipient.displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{gift.recipient.displayName}</span>
            <span className="text-orange-600 font-bold">
              ${(gift.amount / 100).toFixed(2)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground truncate">{gift.comment}</p>
        </div>
        {campaignOpen && (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={onEdit} aria-label="Edit gift">Edit</Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={onDelete}
              disabled={isDeleting}
              aria-label="Delete gift"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}