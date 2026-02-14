"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface GiftFormProps {
  recipientName: string | null;
  remainingBudget: number;
  onSubmit: (amount: number, comment: string) => Promise<void>;
  initialAmount?: number;
  initialComment?: string;
  isEdit?: boolean;
}

export function GiftForm({
  recipientName,
  remainingBudget,
  onSubmit,
  initialAmount,
  initialComment,
  isEdit,
}: GiftFormProps) {
  const [amount, setAmount] = useState(initialAmount ? (initialAmount / 100).toString() : "");
  const [comment, setComment] = useState(initialComment || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const cents = Math.round(parseFloat(amount) * 100);
    if (isNaN(cents) || cents <= 0) return;
    setSubmitting(true);
    try {
      await onSubmit(cents, comment);
      if (!isEdit) {
        setAmount("");
        setComment("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {recipientName ? (
        <p className="font-medium">
          {isEdit ? "Editing gift for" : "Gifting to"}{" "}
          <span className="text-orange-600">{recipientName}</span>
        </p>
      ) : (
        <p className="text-muted-foreground">Select a coworker to start gifting</p>
      )}

      <div>
        <Label htmlFor="amount">Amount ($)</Label>
        <Input
          id="amount"
          type="number"
          min="0.01"
          step="0.01"
          max={(remainingBudget / 100).toFixed(2)}
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={!recipientName}
        />
      </div>

      <div>
        <Label htmlFor="comment">Comment</Label>
        <Textarea
          id="comment"
          placeholder="Say something nice..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={!recipientName}
          rows={3}
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!recipientName || !amount || !comment || submitting}
        className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600"
        size="lg"
      >
        {submitting ? "Sending..." : isEdit ? "Update Gift" : "Send Gift"}
      </Button>
    </div>
  );
}
