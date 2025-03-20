"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useWallet } from "@jup-ag/wallet-adapter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@heroui/react";
import { Slider } from "@heroui/react";
import { ToastNotification } from "@/components/common/ToastNotificationDisplay";
import { sendSolTip, getWalletBalance, getSolPriceInUSD } from "@/utils/solana";
import { PublicKey } from "@solana/web3.js";
import { Submission } from "@/types/submission";
import { Spinner } from "@heroui/react";
// import { TipJar } from "../ui/tipjar";
import {
  CircleFadingArrowUp,
  MapPin,
  ExternalLink,
  Info,
  XCircle,
  FileSearch,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const ITEMS_PER_PAGE = 6;

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      });

      if (searchTerm) {
        queryParams.append("search", searchTerm);
      }

      const url = `/api/v1/submission?${queryParams}`;

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch submissions");
      }

      const data = await response.json();
      setSubmissions(data.submissions);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load submissions. Please try again.";

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, ITEMS_PER_PAGE]);

  const fetchSolPrice = async () => {
    const price = await getSolPriceInUSD();
    setSolPrice(price);
  };

  useEffect(() => {
    fetchSubmissions();
    fetchSolPrice();
  }, [fetchSubmissions]);

  useEffect(() => {
    if (searchTerm !== "") {
      setCurrentPage(1);
    }
  }, [searchTerm]);

  useEffect(() => {
    const initialTipAmounts = submissions.reduce((acc, submission) => {
      acc[submission.id] = 5;
      return acc;
    }, {} as { [key: string]: number });
    setTipAmounts(initialTipAmounts);
  }, [submissions]);

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

  const handleViewDetails = (submission: Submission) => {
    setSelectedSubmission(submission);
  };

  const handleNextCard = () => {
    if (submissions.length === 0) return;
    setActiveCardIndex((prevIndex) =>
      prevIndex === submissions.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handlePrevCard = () => {
    if (submissions.length === 0) return;
    setActiveCardIndex((prevIndex) =>
      prevIndex === 0 ? submissions.length - 1 : prevIndex - 1
    );
  };

  useEffect(() => {
    setActiveCardIndex(0);
  }, [submissions]);

  const SkeletonCard = () => (
    <div className="w-[300px] h-[400px] rounded-xl bg-gray-800 overflow-hidden p-4 animate-pulse flex flex-col border border-[#7272724f] shadow-md">
      <div className="flex flex-row justify-between mb-4">
        <div className="flex-1">
          <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-[#3ecf8e30] rounded w-1/2"></div>
        </div>
        <div className="w-16 h-6 bg-gray-700 rounded ml-2"></div>
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

        <div className="h-9 bg-[#3ecf8e30] rounded-md w-full"></div>
      </div>
    </div>
  );

  if (loading && submissions.length === 0) {
    return (
      <div className="w-full mx-auto p-0">
        <div className="w-full flex flex-col items-center justify-center">
          <div className="w-[300px] relative">
            <div className="relative h-[450px] w-[300px] flex items-center justify-center perspective-1000 my-2">
              <div
                className="absolute top-0 left-0 w-[300px] h-[400px]"
                style={{
                  transform:
                    "translateZ(-20px) scale(0.95) translateX(20px) rotate(2deg)",
                  opacity: 0.8,
                  zIndex: 2,
                }}
              >
                <SkeletonCard />
              </div>
              <div
                className="absolute top-0 left-0 w-[300px] h-[400px]"
                style={{
                  transform: "translateZ(0) scale(1) rotate(0deg)",
                  opacity: 1,
                  zIndex: 3,
                }}
              >
                <SkeletonCard />
              </div>
              <div
                className="absolute top-0 left-0 w-[300px] h-[400px]"
                style={{
                  transform:
                    "translateZ(-40px) scale(0.9) translateX(40px) rotate(3deg)",
                  opacity: 0.6,
                  zIndex: 1,
                }}
              >
                <SkeletonCard />
              </div>
            </div>
            <div className="flex justify-center gap-2 -mt-8">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div
                  key={index}
                  className="h-2 w-2 rounded-full bg-gray-600 animate-pulse"
                />
              ))}
            </div>
            <div className="text-gray-400 text-xs text-center mt-3 animate-pulse">
              <div className="h-4 bg-gray-700 rounded w-32 mx-auto mb-1"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {loading && submissions.length > 0 && (
        <div className="w-full mb-4">
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 w-full justify-center opacity-30">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      )}

      {submissions.length === 0 && !loading && (
        <div className="w-full py-12 px-4 flex flex-col items-center justify-center text-center bg-[#1e1f1f] border border-[#7272724f] rounded-xl shadow-md animate-in fade-in">
          <div className="p-4 rounded-full bg-[#3ecf8e10] mb-5">
            <FileSearch className="h-12 w-12 text-[#3ecf8e]" />
          </div>
          <h3 className="text-white text-lg font-medium mb-2">
            {searchTerm ? "No results found" : "No submissions available yet"}
          </h3>
          <p className="text-gray-400 max-w-md">
            {searchTerm
              ? `We couldn't find any submissions matching "${searchTerm}". Try a different search term or clear your search.`
              : "Be the first to create a submission and share your project with the community!"}
          </p>
          {searchTerm && (
            <Button
              variant="bordered"
              onPress={() => {
                setSearchTerm("");
              }}
              className="mt-4 text-[#3ecf8e] border-[#3ecf8e] hover:bg-[#3ecf8e20]"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Clear Search
            </Button>
          )}
        </div>
      )}

      {submissions.length > 0 && !loading && (
        <div className="w-full flex flex-col items-center justify-center">
          <div className="w-[300px] relative">
            <div className="relative h-[450px] w-[300px] flex items-center justify-center perspective-1000">
              {submissions.map((submission, index) => {
                const isOwnSubmission =
                  connected &&
                  publicKey &&
                  submission.userWallet === publicKey.toString();
                const isTipped = tippedSubmissions.has(submission.id);
                const tipAmount = tipAmounts[submission.id] || 5;

                const offset =
                  (index - activeCardIndex + submissions.length) %
                  submissions.length;
                const visible = offset <= 2;
                const zIndex = submissions.length - offset;

                let transform = "scale(1)";
                let opacity = 1;

                if (offset === 0) {
                  transform = "translateZ(0) scale(1) rotate(0deg)";
                } else if (offset === 1) {
                  transform =
                    "translateZ(-20px) scale(0.95) translateX(20px) rotate(2deg)";
                  opacity = 0.8;
                } else if (offset === 2) {
                  transform =
                    "translateZ(-40px) scale(0.9) translateX(40px) rotate(3deg)";
                  opacity = 0.6;
                } else {
                  opacity = 0;
                }

                return (
                  <Card
                    key={submission.id}
                    className={`absolute top-0 left-0 w-[300px] bg-[#121313] h-[400px] flex flex-col border-[#7272724f] shadow-md transition-all duration-500 ${
                      index === activeCardIndex
                        ? "shadow-[0_0_20px_rgba(62,207,142,0.2)] card-hover"
                        : ""
                    }`}
                    style={{
                      zIndex,
                      transform,
                      opacity,
                      display: visible ? "flex" : "none",
                    }}
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
                    {/* <TipJar /> */}
                    <CardContent className="flex-grow flex flex-col p-2 sm:p-3 pt-0">
                      <p className="text-white text-xs sm:text-lg leading-tight mb-3 line-clamp-6 w-full pr-0">
                        {submission.description}
                      </p>
                      <div className="mt-auto">
                        <div className="flex flex-row text-white gap-1 sm:gap-2 items-center">
                          <span className="text-xs sm:text-sm">$5</span>
                          <Slider
                            minValue={5}
                            maxValue={50}
                            step={5}
                            value={[tipAmount]}
                            onChange={(value) =>
                              handleSliderChange(
                                submission.id,
                                value as number[]
                              )
                            }
                            className="flex-grow"
                            color="success"
                          />
                          <span className="text-xs sm:text-sm">$50</span>
                        </div>
                        <p className="mt-2 mb-2 text-white text-sm">
                          Tip Amount:{" "}
                          <span className="text-[#3ecf8e]">
                            ${tipAmount.toFixed(2)}
                          </span>
                        </p>
                        <div className="flex flex-row gap-2">
                          <Button
                            variant={"bordered"}
                            onPress={() => handleTip(submission)}
                            disabled={
                              !connected ||
                              isOwnSubmission ||
                              isTipped ||
                              tippingSubmissionId === submission.id
                            }
                            className="mt-1 flex-grow sm:flex-grow-0"
                            size="sm"
                            color="success"
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
                            variant="bordered"
                            onPress={() => handleViewDetails(submission)}
                            className="mt-1 text-xs"
                            size="sm"
                            color="secondary"
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
            <div className="flex items-center justify-center gap-4 -mt-8">
              <Button
                variant="bordered"
                onPress={handlePrevCard}
                className="rounded-full aspect-square min-w-8 h-8 bg-[#181919] border-[#3ecf8e33] text-[#3ecf8e] hover:bg-[#3ecf8e20] hover:scale-110 p-0 shadow-md transition-all duration-300"
                disabled={loading || submissions.length <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex gap-2">
                {submissions.map((_, index) => (
                  <button
                    key={index}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === activeCardIndex
                        ? "bg-[#3ecf8e] w-6 shadow-[0_0_10px_rgba(62,207,142,0.5)]"
                        : "bg-gray-600 w-2 hover:bg-gray-400"
                    }`}
                    onClick={() => setActiveCardIndex(index)}
                    aria-label={`Go to card ${index + 1}`}
                  />
                ))}
              </div>
              <Button
                variant="bordered"
                onPress={handleNextCard}
                className="rounded-full aspect-square min-w-8 h-8 bg-[#181919] border-[#3ecf8e33] text-[#3ecf8e] hover:bg-[#3ecf8e20] hover:scale-110 p-0 shadow-md transition-all duration-300"
                disabled={loading || submissions.length <= 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-gray-400 text-xs text-center mt-1">
              Card {activeCardIndex + 1} of {submissions.length} • $
              {submissions[activeCardIndex]?.currentTips.toFixed(2)} tipped
            </div>
          </div>
        </div>
      )}
      {selectedSubmission && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-300"
          style={{
            backdropFilter: "blur(4px)",
            transition:
              "backdrop-filter 500ms ease-in-out 150ms, background-color 300ms ease-in-out",
          }}
        >
          <div className="bg-[#121212] border border-[#7272724f] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-3 border-b border-[#7272724f] flex justify-between items-center">
              <h3 className="text-base sm:text-lg font-semibold text-white">
                {selectedSubmission.title}
              </h3>
              <Button
                variant="bordered"
                onPress={() => setSelectedSubmission(null)}
                className="text-xs"
                size="sm"
                color="secondary"
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
