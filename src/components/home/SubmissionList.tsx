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
import { Spinner } from "@heroui/react";
import { CircleFadingArrowUp } from "lucide-react";

const toast = new ToastNotification("submission-list");

export default function SubmissionList() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
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
    setLoading(true);
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
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-8 sm:py-16">
        {/* Mobile view - just spinner without text */}
        <div className="sm:hidden flex items-center justify-center">
          <Spinner
            classNames={{ label: "text-foreground mt-4" }}
            // label="spinner"
            variant="spinner"
            color="success"
            size="lg"
          />
        </div>

        {/* Desktop view - loading text and skeleton cards */}
        <div className="hidden sm:block w-full">
          {/* Loading text with dots animation */}
          <div className="text-[#3ecf8e] text-2xl font-medium mb-10 text-center flex">
            Loading submissions, please wait
            <Spinner
              classNames={{ label: "text-foreground mt-4" }}
              variant="dots"
              color="success"
            />
          </div>

          {/* Skeleton cards - reduced to 3 */}
          <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full opacity-30">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-80 rounded-xl bg-gray-800 overflow-hidden p-4 animate-pulse flex flex-col"
              >
                {/* Card header with title and link */}
                <div className="flex flex-row justify-between mb-4">
                  <div className="flex-1">
                    <div className="h-5 bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-[#3ecf8e30] rounded w-1/2"></div>
                  </div>
                  <div className="w-16 h-10 bg-gray-700 rounded ml-2"></div>
                </div>

                {/* Card description */}
                <div className="space-y-2 mb-auto">
                  <div className="h-3 bg-gray-700 rounded w-full"></div>
                  <div className="h-3 bg-gray-700 rounded w-full"></div>
                  <div className="h-3 bg-gray-700 rounded w-4/5"></div>
                  <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                </div>

                {/* Slider section */}
                <div className="mt-auto">
                  <div className="flex flex-row items-center mb-2">
                    <div className="w-5 h-4 bg-gray-700 rounded mr-2"></div>
                    <div className="h-2 bg-gray-700 rounded-full flex-grow"></div>
                    <div className="w-5 h-4 bg-gray-700 rounded ml-2"></div>
                  </div>

                  <div className="h-4 bg-gray-700 rounded w-32 mb-3"></div>

                  {/* Button */}
                  <div className="h-9 bg-[#3ecf8e30] rounded-md w-full sm:w-36"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto md:border border-[#7272724f] rounded-3xl p-4 sm:p-5 md:p-6 lg:p-8">
      <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full">
        {submissions.map((submission) => {
          const isOwnSubmission =
            connected &&
            publicKey &&
            submission.userWallet === publicKey.toString();
          const isTipped = tippedSubmissions.has(submission.id);
          const tipAmount = tipAmounts[submission.id] || 5;

          return (
            <Card
              key={submission.id}
              className="bg-transparent h-full flex flex-col"
            >
              <CardHeader className="flex flex-row justify-between pb-2">
                <div className="overflow-hidden mr-2 flex-1">
                  <CardTitle className="text-white text-sm xs:text-base md:text-lg break-words hyphens-auto">
                    {submission.title}
                  </CardTitle>
                  <a
                    href={submission.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3ecf8e] underline underline-offset-2 text-xs break-all hyphens-auto"
                  >
                    {submission.link}
                  </a>
                </div>
                <p className="text-white leading-5 text-center text-xs whitespace-nowrap ml-2 flex-shrink-0">
                  ${submission.currentTips.toFixed(2)}
                  <br />
                  Tipped!
                </p>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col">
                <p className="text-white text-xs sm:text-sm text-balance leading-tight mb-auto">
                  Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                  Consequatur incidunt vero, velit, reprehenderit aut illo
                  dolorem, nulla voluptatibus harum ea praesentium! Unde id
                  doloribus eaque porro voluptatibus necessitatibus modi
                  distinctio!
                </p>
                <div className="mt-4">
                  <div className="flex flex-row text-white gap-1 sm:gap-2 items-center">
                    <span className="text-xs sm:text-sm">$5</span>
                    <Slider
                      min={5}
                      max={50}
                      step={5}
                      value={[tipAmount]}
                      onValueChange={(value) =>
                        handleSliderChange(submission.id, value)
                      }
                      className="flex-grow"
                    />
                    <span className="text-xs sm:text-sm">$50</span>
                  </div>
                  <p className="mt-2 text-white text-sm">
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
                    className="mt-2 w-full sm:w-auto"
                  >
                    {tippingSubmissionId === submission.id ? (
                      <span className="flex items-center justify-center">
                        <Spinner
                          classNames={{ label: "text-foreground mt-4" }}
                          // label="spinner"
                          variant="spinner"
                          color="success"
                        />
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
    </div>
  );
}
