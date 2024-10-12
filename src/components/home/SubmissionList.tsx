"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@jup-ag/wallet-adapter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ToastNotification } from "@/components/common/ToastNotificationDisplay";
import { sendSolTip } from "@/utils/solana";
import { PublicKey } from "@solana/web3.js";

interface Submission {
  id: string;
  userId: string;
  title: string;
  link: string;
  currentTips: number;
  tipJarLimit: number;
  userWallet: string;
}

const toast = new ToastNotification("submission-list");

export default function SubmissionList() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tipAmount, setTipAmount] = useState<number>(1);
  const [tippedSubmissions, setTippedSubmissions] = useState<Set<string>>(
    new Set()
  );
  const { publicKey, connected, signTransaction } = useWallet();

  useEffect(() => {
    fetchSubmissions();
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

  const handleTip = async (submission: Submission) => {
    if (!connected || !publicKey || !signTransaction) {
      toast.error("Please connect your wallet to tip");
      return;
    }

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

      const signature = await sendSolTip(
        publicKey,
        recipientPubkey,
        tipAmount,
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
          amount: tipAmount,
          currency: "SOL",
          transactionSignature: signature,
        }),
      });

      if (response.ok) {
        toast.success(`Successfully tipped ${tipAmount} SOL`);
        setTippedSubmissions((prev) => new Set(prev).add(submission.id));
        fetchSubmissions();
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
              <p>Current Tips: {submission.currentTips} SOL</p>
              <p>Tip Jar Limit: {submission.tipJarLimit} SOL</p>
              <div className="mt-4">
                <Slider
                  min={0.1}
                  max={10}
                  step={0.1}
                  value={[tipAmount]}
                  onValueChange={(value) => setTipAmount(value[0])}
                />
                <p className="mt-2">Tip Amount: {tipAmount} SOL</p>
                <Button
                  onClick={() => handleTip(submission)}
                  disabled={!connected || isOwnSubmission || isTipped}
                  className="mt-2"
                >
                  {isTipped
                    ? "Tipped!"
                    : isOwnSubmission
                    ? "Can't tip own submission"
                    : "Send Tip"}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
