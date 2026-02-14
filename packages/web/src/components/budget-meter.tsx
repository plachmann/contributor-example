"use client";

import { Progress } from "@/components/ui/progress";

interface BudgetMeterProps {
  budget: number;
  spent: number;
}

export function BudgetMeter({ budget, spent }: BudgetMeterProps) {
  const remaining = budget - spent;
  const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-orange-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-semibold">Your Budget</span>
        <span className="text-2xl font-bold text-orange-600">
          ${(remaining / 100).toFixed(2)}
        </span>
      </div>
      <Progress value={percentUsed} className="h-4 mb-2" />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>${(spent / 100).toFixed(2)} gifted</span>
        <span>${(budget / 100).toFixed(2)} total</span>
      </div>
    </div>
  );
}
