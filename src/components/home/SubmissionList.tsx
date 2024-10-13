"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@jup-ag/wallet-adapter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ToastNotification } from "@/components/common/ToastNotificationDisplay";
import { sendSolTip, getWalletBalance, getSolPriceInUSD } from "@/utils/solana";
import { PublicKey } from "@solana/web3.js";
import { Submission } from "@/types/submission";
import { Spinner } from "@/components/ui/spinner";
import { CircleFadingArrowUp } from "lucide-react";

const toast = new ToastNotification("submission-list");

export default function SubmissionList() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tippedSubmissions, setTippedSubmissions] = useState<Set<string>>(
    new Set()
  );
  const { publicKey, connected, signTransaction } = useWallet();
  const [solPrice, setSolPrice] = useState<number>(0);
  const [tipAmounts, setTipAmounts] = useState<{ [key: string]: number }>({});
  const [tippingSubmissionId, setTippingSubmissionId] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchSubmissions();
    fetchSolPrice();
  }, []);

  useEffect(() => {
    const initialTipAmounts = submissions.reduce((acc, submission) => {
      acc[submission.id] = 5;
      return acc;
    }, {} as { [key: string]: number });
    setTipAmounts(initialTipAmounts);
  }, [submissions]);

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
      const tipAmountUSD = tipAmounts[submission.id];
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

  const handleSliderChange = (submissionId: string, value: number[]) => {
    setTipAmounts((prev) => ({ ...prev, [submissionId]: value[0] }));
  };

  return (
    <div className="gap-2 grid grid-cols-1 sm:grid-cols-2 sm:max-w-2xl max-w-md justify-center sm:justify-start mx-auto sm:mx-0 md:border border-[#7272724f] rounded-3xl p-0 sm:p-6 mt-2 sm:mt-6">
      {submissions.map((submission) => {
        const isOwnSubmission =
          connected &&
          publicKey &&
          submission.userWallet === publicKey.toString();
        const isTipped = tippedSubmissions.has(submission.id);
        const tipAmount = tipAmounts[submission.id] || 5;

        return (
          <Card key={submission.id} className="bg-transparent">
            <CardHeader className="flex flex-row justify-between">
              <span>
                <CardTitle className="text-white">{submission.title}</CardTitle>
                <a
                  href={submission.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3ecf8e] underline underline-offset-2 text-xs"
                >
                  {submission.link}
                </a>
              </span>
              <p className="text-white leading-5 text-center text-xs">
                ${submission.currentTips.toFixed(2)}
                <br />
                Tipped!
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-white text-xs sm:text-sm text-balance leading-tight">
                Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                Consequatur incidunt vero, velit, reprehenderit aut illo
                dolorem, nulla voluptatibus harum ea praesentium! Unde id
                doloribus eaque porro voluptatibus necessitatibus modi
                distinctio!
              </p>
              <div className="mt-4">
                <div className="flex flex-row text-white gap-1 sm:gap-2">
                  $5
                  <Slider
                    min={5}
                    max={50}
                    step={5}
                    value={[tipAmount]}
                    onValueChange={(value) =>
                      handleSliderChange(submission.id, value)
                    }
                  />
                  $50
                </div>
                <p className="mt-2 text-white">
                  Tip Amount:{" "}
                  <span className="text-[#3ecf8e]">
                    ${tipAmount.toFixed(2)}
                  </span>
                </p>
                <Button
                  variant={"tippit"}
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
                  ) : !connected ? (
                    "Connect Wallet to Tip"
                  ) : (
                    <span className="flex items-center justify-center ">
                      Send Tip!
                      <CircleFadingArrowUp className="ml-2 h-4 w-4 animate-fade" />
                    </span>
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
