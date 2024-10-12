"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@jup-ag/wallet-adapter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ToastNotification } from "@/components/common/ToastNotificationDisplay";
import { sendSolTip, getWalletBalance, getSolPriceInUSD } from "@/utils/solana";
import { PublicKey } from "@solana/web3.js";
import { Submission } from "@/types/submission";
import { Spinner } from "@/components/ui/spinner";

const toast = new ToastNotification("submission-list");

export default function SubmissionList() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tippedSubmissions, setTippedSubmissions] = useState<Set<string>>(
    new Set()
  );
  const { publicKey, connected, signTransaction } = useWallet();
  const [solPrice, setSolPrice] = useState<number>(0);
  const [tipAmountUSD, setTipAmountUSD] = useState<number>(1);
  const [tippingSubmissionId, setTippingSubmissionId] = useState<string | null>(
    null
  );
  useEffect(() => {
    fetchSubmissions();
    fetchSolPrice();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch("/api/v1/submission");
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      } else {
        throw new Error("Failed to fetch submissions");
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Failed to load submissions. Please try again.");
    }
  };

  const fetchSolPrice = async () => {
    const price = await getSolPriceInUSD();
    setSolPrice(price);
  };

  const handleTip = async (submission: Submission) => {
    if (!connected || !publicKey || !signTransaction) {
      toast.error("Please connect your wallet to tip");
      return;
    }

    setTippingSubmissionId(submission.id);

    try {
      if (!submission.userWallet) {
        throw new Error("Recipient wallet address is missing");
      }

      let recipientPubkey: PublicKey;
      try {
        recipientPubkey = new PublicKey(submission.userWallet);
      } catch (error) {
        console.error("Invalid recipient wallet address:", error);
        toast.error("Invalid recipient wallet address");
        return;
      }

      const balance = await getWalletBalance(publicKey);
      const tipAmountSOL = Number((tipAmountUSD / solPrice).toFixed(9));
      console.log(`Tipping ${tipAmountSOL} SOL (${tipAmountUSD} USD)`);

      if (balance < tipAmountSOL) {
        toast.error(
          `Insufficient balance. You have ${balance.toFixed(
            4
          )} SOL, but the tip requires ${tipAmountSOL.toFixed(4)} SOL.`
        );
        return;
      }

      const signature = await sendSolTip(
        publicKey,
        recipientPubkey,
        tipAmountSOL,
        signTransaction
      );

      const response = await fetch("/api/v1/tip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId: submission.id,
          userWallet: publicKey.toString(),
          amount: tipAmountSOL,
          currency: "SOL",
          transactionSignature: signature,
        }),
      });

      if (response.ok) {
        toast.success(
          `Successfully tipped ${tipAmountSOL.toFixed(
            4
          )} SOL ($${tipAmountUSD.toFixed(2)})`
        );
        setTippedSubmissions((prev) => new Set(prev).add(submission.id));
        fetchSubmissions();
        fetchSolPrice();
      } else {
        throw new Error("Failed to record tip");
      }
    } catch (error) {
      console.error("Error sending tip:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to send tip. Please try again."
      );
    } finally {
      setTippingSubmissionId(null);
    }
  };

  return (
    <div className="space-y-4">
      {submissions.map((submission) => {
        const isOwnSubmission =
          connected &&
          publicKey &&
          submission.userWallet === publicKey.toString();
        const isTipped = tippedSubmissions.has(submission.id);

        return (
          <Card key={submission.id}>
            <CardHeader>
              <CardTitle>{submission.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Link:{" "}
                <a
                  href={submission.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {submission.link}
                </a>
              </p>
              <p>Current Tips: ${submission.currentTips.toFixed(2)}</p>
              <p>Tip Jar Limit: ${submission.tipJarLimit.toFixed(2)}</p>
              <div className="mt-4">
                <Slider
                  min={0.1}
                  max={200}
                  step={0.1}
                  value={[tipAmountUSD]}
                  onValueChange={(value) => setTipAmountUSD(value[0])}
                />
                <p className="mt-2">Tip Amount: ${tipAmountUSD.toFixed(2)}</p>
                <Button
                  onClick={() => handleTip(submission)}
                  disabled={
                    !connected ||
                    isOwnSubmission ||
                    isTipped ||
                    tippingSubmissionId === submission.id
                  }
                  className="mt-2"
                >
                  {tippingSubmissionId === submission.id ? (
                    <span className="flex items-center justify-center">
                      <Spinner className="mr-2 h-4 w-4" />
                      Tipping...
                    </span>
                  ) : isTipped ? (
                    "Tipped!"
                  ) : isOwnSubmission ? (
                    "Can't tip own submission"
                  ) : (
                    "Send Tip"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
