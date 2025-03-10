export interface Submission {
  id: string;
  userId: string;
  title: string;
  link: string;
  description: string;
  currentTips: number;
  tipJarLimit: number;
  user: {
    wallet: string;
  };
  userWallet?: string;
}
