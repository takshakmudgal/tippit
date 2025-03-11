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
import { Spinner, Pagination } from "@heroui/react";
import { CircleFadingArrowUp, MapPin, ExternalLink, Info } from "lucide-react";

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
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [isSmallScreen, setIsSmallScreen] = useState(true);
  const itemsPerPage = {
    sm: 6,
    lg: 9,
  };

  useEffect(() => {
    fetchSubmissions();
    fetchSolPrice();

    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 1024);
    };

    checkScreenSize();

    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [isSmallScreen]);

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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch submissions");
      }

      const data = await response.json();
      setSubmissions(data);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load submissions. Please try again.";

      toast.error(errorMessage);
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
      toast.error("Please connect your wallet to send a tip");
      return;
    }

    if (tippingSubmissionId) {
      toast.info("A transaction is already in progress");
      return;
    }

    const tipAmount = tipAmounts[submission.id] || 5;
    setTippingSubmissionId(submission.id);

    try {
      if (!submission.userWallet) {
        throw new Error("Recipient wallet address is missing");
      }

      const recipientWallet = new PublicKey(submission.userWallet);
      const walletBalance = await getWalletBalance(publicKey);

      if (walletBalance < tipAmount / solPrice) {
        toast.error(`Insufficient balance to send $${tipAmount} worth of SOL`);
        return;
      }

      const transactionSignature = await sendSolTip(
        publicKey,
        recipientWallet,
        tipAmount / solPrice,
        signTransaction
      );

      if (!transactionSignature) {
        throw new Error("Transaction was not completed");
      }

      const response = await fetch("/api/v1/tip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId: submission.id,
          wallet: publicKey.toString(),
          amount: tipAmount,
          transactionSignature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to record tip");
      }

      toast.success(`Successfully tipped $${tipAmount}!`);
      setTippedSubmissions((prev) => new Set(prev).add(submission.id));
      fetchSubmissions();
      fetchSolPrice();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to send tip. Please try again.";

      toast.error(errorMessage);
    } finally {
      setTippingSubmissionId(null);
    }
  };

  const handleSliderChange = (submissionId: string, value: number[]) => {
    setTipAmounts((prev) => ({ ...prev, [submissionId]: value[0] }));
  };

  const getPaginatedSubmissions = () => {
    const perPage = isSmallScreen ? itemsPerPage.sm : itemsPerPage.lg;
    const totalPages = Math.ceil(submissions.length / perPage);

    const startIndex = (currentPage - 1) * perPage;
    const endIndex = Math.min(startIndex + perPage, submissions.length);

    return {
      items: submissions.slice(startIndex, endIndex),
      totalPages,
    };
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    document
      .querySelector(".submissions-container")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleViewDetails = (submission: Submission) => {
    setSelectedSubmission(submission);
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-8 sm:py-16">
        <div className="sm:hidden flex items-center justify-center">
          <Spinner
            classNames={{ label: "text-foreground mt-4" }}
            variant="spinner"
            color="success"
            size="lg"
          />
        </div>

        <div className="hidden sm:block w-full">
          <div className="text-white text-2xl mb-10 text-center flex gap-2 items-center justify-center">
            <Spinner
              classNames={{ label: "text-foreground mt-4" }}
              variant="spinner"
              color="success"
            />
            Loading submissions, please wait.
          </div>

          <div className="grid gap-5 grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 w-full opacity-30">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-full h-auto rounded-xl bg-gray-800 overflow-hidden p-4 animate-pulse flex flex-col border border-[#7272724f] shadow-md"
              >
                <div className="flex flex-row justify-between mb-4">
                  <div className="flex-1">
                    <div className="h-5 bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-[#3ecf8e30] rounded w-1/2"></div>
                  </div>
                  <div className="w-16 h-10 bg-gray-700 rounded ml-2"></div>
                </div>
                <div className="space-y-2 mb-4 w-full pr-0">
                  <div className="h-3 bg-gray-700 rounded w-full"></div>
                  <div className="h-3 bg-gray-700 rounded w-full"></div>
                  <div className="h-3 bg-gray-700 rounded w-4/5"></div>
                </div>

                <div className="mt-auto">
                  <div className="flex flex-row items-center mb-2">
                    <div className="w-5 h-4 bg-gray-700 rounded mr-2"></div>
                    <div className="h-2 bg-gray-700 rounded-full flex-grow"></div>
                    <div className="w-5 h-4 bg-gray-700 rounded ml-2"></div>
                  </div>

                  <div className="h-4 bg-gray-700 rounded w-32 mb-3"></div>

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
    <div className="w-full mx-auto p-0 submissions-container">
      <div className="grid gap-2 md:gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 w-full">
        {getPaginatedSubmissions().items.map((submission) => {
          const isOwnSubmission =
            connected &&
            publicKey &&
            submission.userWallet === publicKey.toString();
          const isTipped = tippedSubmissions.has(submission.id);
          const tipAmount = tipAmounts[submission.id] || 5;

          return (
            <Card
              key={submission.id}
              className="bg-transparent h-auto w-full flex flex-col border-[#7272724f] shadow-md hover:shadow-lg transition-all duration-300"
            >
              <CardHeader className="flex flex-row justify-between p-3 sm:p-4">
                <div className="overflow-hidden mr-2 flex-1">
                  <CardTitle className="text-white text-sm xs:text-base md:text-lg break-words hyphens-auto">
                    {submission.title}
                  </CardTitle>
                  <a
                    href={submission.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3ecf8e] underline underline-offset-2 text-xs break-all hyphens-auto line-clamp-1 mt-1"
                  >
                    {submission.link}
                  </a>

                  {submission.geolocation && (
                    <div className="mt-1 flex items-start">
                      <div className="text-xs text-gray-400 flex gap-1 items-start">
                        <MapPin className="h-3 w-3 text-[#3ecf8e] flex-shrink-0" />
                        <span className="line-clamp-1">
                          {submission.geolocation.formattedAddress}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-white leading-5 text-center text-xs whitespace-nowrap ml-2 flex-shrink-0">
                  ${submission.currentTips.toFixed(2)}
                  <br />
                  Tipped!
                </p>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col p-2 sm:p-3 pt-0">
                <p className="text-white text-xs sm:text-sm leading-tight mb-3 line-clamp-3 w-full pr-0">
                  {submission.description}
                </p>
                <div className="mt-auto">
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
                  <p className="mt-2 mb-2 text-white text-sm">
                    Tip Amount:{" "}
                    <span className="text-[#3ecf8e]">
                      ${tipAmount.toFixed(2)}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={"tippit"}
                      onClick={() => handleTip(submission)}
                      disabled={
                        !connected ||
                        isOwnSubmission ||
                        isTipped ||
                        tippingSubmissionId === submission.id
                      }
                      className="mt-1 flex-grow sm:flex-grow-0"
                      size="sm"
                    >
                      {tippingSubmissionId === submission.id ? (
                        <span className="flex items-center justify-center">
                          <Spinner
                            variant="spinner"
                            color="default"
                            size="sm"
                            classNames={{
                              wrapper: "mr-2",
                            }}
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

                    <Button
                      variant="outline"
                      onClick={() => handleViewDetails(submission)}
                      className="mt-1 text-xs"
                      size="sm"
                    >
                      <Info className="h-3.5 w-3.5 mr-1" />
                      Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {submissions.length > 0 && (
        <div className="mt-4 flex flex-row items-center justify-start">
          <div className="text-gray-400 text-xs mr-3">
            Showing {getPaginatedSubmissions().items.length} of{" "}
            {submissions.length}
          </div>
          <Pagination
            loop
            showControls
            color="success"
            initialPage={1}
            page={currentPage}
            total={getPaginatedSubmissions().totalPages}
            onChange={handlePageChange}
            classNames={{
              wrapper: "gap-1",
              item: "text-white bg-transparent",
              cursor: "bg-[#3ecf8e] text-black",
            }}
          />
        </div>
      )}

      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-[#121212] border border-[#7272724f] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-3 border-b border-[#7272724f] flex justify-between items-center">
              <h3 className="text-base sm:text-lg font-semibold text-white">
                {selectedSubmission.title}
              </h3>
              <Button
                variant="outline"
                onClick={() => setSelectedSubmission(null)}
                className="text-xs"
                size="sm"
              >
                Close
              </Button>
            </div>
            <div className="p-3 space-y-3">
              <div>
                <h4 className="text-xs sm:text-sm text-gray-400 mb-1">Link</h4>
                <div className="flex items-center">
                  <a
                    href={selectedSubmission.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3ecf8e] underline underline-offset-2 text-xs sm:text-sm break-all mr-2"
                  >
                    {selectedSubmission.link}
                  </a>
                  <ExternalLink size={14} className="text-[#3ecf8e]" />
                </div>
              </div>

              {selectedSubmission.geolocation && (
                <div>
                  <h4 className="text-xs sm:text-sm text-gray-400 mb-1">
                    Location
                  </h4>
                  <div className="space-y-1">
                    <div className="flex items-start">
                      <MapPin
                        size={14}
                        className="text-[#3ecf8e] mt-1 mr-2 flex-shrink-0"
                      />
                      <span className="text-white text-xs sm:text-sm">
                        {selectedSubmission.geolocation.formattedAddress}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs sm:text-sm text-gray-400 mb-1">
                  Description
                </h4>
                <p className="text-white text-xs sm:text-sm">
                  {selectedSubmission.description}
                </p>
              </div>

              <div>
                <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                  <div>
                    <span className="text-gray-400">Current Tips:</span>
                    <span className="text-white ml-2">
                      ${selectedSubmission.currentTips.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Tip Jar Limit:</span>
                    <span className="text-white ml-2">
                      ${selectedSubmission.tipJarLimit.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-300 break-all">
                  <span className="text-gray-400">Wallet:</span>{" "}
                  {selectedSubmission.userWallet ||
                    selectedSubmission.user.wallet}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
