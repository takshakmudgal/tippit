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
import {
  CircleFadingArrowUp,
  MapPin,
  ExternalLink,
  Info,
  // Search,
  XCircle,
  FileSearch,
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

  const [currentPage, setCurrentPage] = useState(1);
  // const [isSmallScreen, setIsSmallScreen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  // const [inputSearchTerm, setInputSearchTerm] = useState("");
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 6,
    totalPages: 1,
  });
  // const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(
  //   null
  // );
  // const [preSearchPage, setPreSearchPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    fetchSubmissions();
    fetchSolPrice();

    // const checkScreenSize = () => {
    //   setIsSmallScreen(window.innerWidth < 1024);
    // };

    // checkScreenSize();

    // window.addEventListener("resize", checkScreenSize);

    // return () => window.removeEventListener("resize", checkScreenSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useEffect(() => {
  //   setInputSearchTerm(searchTerm);
  // }, []);

  useEffect(() => {
    if (searchTerm !== "") {
      setCurrentPage(1);
    }
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  useEffect(() => {
    fetchSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

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
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      });

      if (searchTerm) {
        queryParams.append("search", searchTerm);
      }

      const url = `/api/v1/submission?${queryParams}`;
      console.log(`Fetching submissions: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch submissions");
      }

      const data = await response.json();
      console.log(
        `Received ${data.submissions.length} submissions, page ${data.pagination.page} of ${data.pagination.totalPages}`
      );
      setSubmissions(data.submissions);
      setPagination(data.pagination);
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

  const handlePageChange = (page: number) => {
    console.log(`Changing to page ${page}`);
    setCurrentPage(page);
    document
      .querySelector(".submissions-container")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleViewDetails = (submission: Submission) => {
    setSelectedSubmission(submission);
  };

  // Skeleton card component for reuse
  const SkeletonCard = () => (
    <div className="w-full h-auto rounded-xl bg-gray-800 overflow-hidden p-4 animate-pulse flex flex-col border border-[#7272724f] shadow-md">
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
  );

  // const SearchInputComponent = () => {
  //   const inputRef = React.useRef<HTMLInputElement>(null);

  //   const handleSearch = (e?: React.FormEvent) => {
  //     e?.preventDefault();
  //     if (inputSearchTerm && !searchTerm) {
  //       setPreSearchPage(currentPage);
  //     }
  //     setSearchTerm(inputSearchTerm);
  //     // No focus manipulation
  //   };

  //   const handleClearSearch = (e: React.MouseEvent) => {
  //     e.preventDefault();
  //     setInputSearchTerm("");
  //     setTimeout(() => {
  //       setCurrentPage(preSearchPage);
  //       setSearchTerm("");
  //     }, 0);
  //     // No focus manipulation
  //   };

  //   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  //     if (e.key === "Enter") {
  //       e.preventDefault();
  //       handleSearch();
  //     }
  //   };

  //   const handleButtonClick = (e: React.MouseEvent) => {
  //     e.preventDefault();
  //     if (searchTerm) {
  //       handleClearSearch(e);
  //     } else {
  //       handleSearch();
  //     }
  //   };

  //   return (
  //     <div className="w-full mt-8 sm:mt-10 mb-6 md:mb-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
  //       <form onSubmit={handleSearch} className="relative w-full md:w-64 flex">
  //         <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
  //           <Search className="h-4 w-4 text-gray-400" />
  //         </div>
  //         <input
  //           ref={inputRef}
  //           type="text"
  //           value={inputSearchTerm}
  //           onChange={(e) => setInputSearchTerm(e.target.value)}
  //           onKeyDown={handleKeyDown}
  //           placeholder="Search submissions..."
  //           autoFocus={true}
  //           className="w-full p-2 pl-10 pr-10 rounded-md bg-[#232424] border border-gray-300 text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-[#3ecf8e]"
  //         />
  //         <button
  //           type="button"
  //           onClick={handleButtonClick}
  //           className="absolute inset-y-0 right-0 flex items-center pr-2"
  //           aria-label={searchTerm ? "Clear search" : "Search"}
  //         >
  //           <div className="p-1 hover:bg-[#3ecf8e20] rounded">
  //             {searchTerm ? (
  //               <svg
  //                 xmlns="http://www.w3.org/2000/svg"
  //                 width="16"
  //                 height="16"
  //                 viewBox="0 0 24 24"
  //                 fill="none"
  //                 stroke="currentColor"
  //                 strokeWidth="2"
  //                 strokeLinecap="round"
  //                 strokeLinejoin="round"
  //                 className="text-[#3ecf8e]"
  //               >
  //                 <path d="M18 6 6 18"></path>
  //                 <path d="m6 6 12 12"></path>
  //               </svg>
  //             ) : (
  //               <svg
  //                 xmlns="http://www.w3.org/2000/svg"
  //                 width="16"
  //                 height="16"
  //                 viewBox="0 0 24 24"
  //                 fill="none"
  //                 stroke="currentColor"
  //                 strokeWidth="2"
  //                 strokeLinecap="round"
  //                 strokeLinejoin="round"
  //                 className="text-[#3ecf8e]"
  //               >
  //                 <path d="M5 12h14"></path>
  //                 <path d="m12 5 7 7-7 7"></path>
  //               </svg>
  //             )}
  //           </div>
  //         </button>
  //       </form>
  //       {searchTerm && pagination.total > 0 && (
  //         <div className="text-sm text-gray-400 flex items-center">
  //           <span className="bg-[#3ecf8e20] text-[#3ecf8e] px-2 py-0.5 rounded-full mr-2 text-xs font-medium">
  //             {pagination.total}
  //           </span>
  //           <span>Result{pagination.total !== 1 ? "s" : ""} found</span>
  //         </div>
  //       )}
  //       {searchTerm && pagination.total === 0 && !loading && (
  //         <div className="text-sm text-gray-400 flex items-center">
  //           <XCircle className="h-4 w-4 text-red-400 mr-2" />
  //           <span>No results for "{searchTerm}"</span>
  //         </div>
  //       )}
  //     </div>
  //   );
  // };

  if (loading && submissions.length === 0) {
    return (
      <div className="w-full mx-auto p-0 submissions-container">
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 w-full opacity-30">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto p-0 submissions-container">
      {loading && submissions.length > 0 && (
        <div className="w-full mb-4">
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 w-full opacity-30">
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
              variant="outline"
              onClick={() => {
                // setInputSearchTerm("");
                // setCurrentPage(preSearchPage);
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
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 w-full">
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
      )}

      {submissions.length > 0 && !loading && (
        <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-0">
          <Pagination
            loop
            showControls
            color="success"
            page={currentPage}
            total={pagination.totalPages > 0 ? pagination.totalPages : 1}
            onChange={handlePageChange}
            classNames={{
              wrapper: "gap-1",
              item: "text-white bg-transparent",
              cursor: "bg-[#3ecf8e] text-black",
            }}
          />
          <div className="text-gray-400 text-xs sm:mr-3 mt-2 sm:mt-0 sm:order-first">
            Page {pagination.page} of {pagination.totalPages} • Showing{" "}
            {submissions.length} of {pagination.total}
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
