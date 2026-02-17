export interface Campaign {
  id: string;
  title: string;
  description: string | null;
  budgetPerUser: number;
  openDate: string;
  closeDate: string;
  totalGifted: number;
  remainingBudget: number;
}