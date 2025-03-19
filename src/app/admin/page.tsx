"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@jup-ag/wallet-adapter";
import { Container } from "@/components/common/Container";
import { Button, Spinner, Tabs, Tab } from "@heroui/react";
import { ToastNotification } from "@/components/common/ToastNotificationDisplay";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";

const ADMIN_WALLET = "7fDgaeRcsY8jdrECFc5qAJkwpuY8qqGbx2RYiVKomyMh";
const toast = new ToastNotification("admin-dashboard");

interface Submission {
  id: string;
  title: string;
  link: string;
  description: string;
  geolocation:
    | {
        formattedAddress: string;
        [key: string]: unknown;
      }
    | string;
  currentTips: number;
  tipJarLimit: number;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  userWallet: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function AdminPage() {
  const { publicKey, connected } = useWallet();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState("pending");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const isAdmin = connected && publicKey?.toString() === ADMIN_WALLET;

  const fetchSubmissions = useCallback(async () => {
    if (!isAdmin) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/admin/submission?wallet=${publicKey?.toString()}&status=${currentTab.toUpperCase()}&page=${
          pagination.page
        }&limit=${pagination.limit}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch submissions");
      }

      const data = await response.json();
      setSubmissions(data.submissions);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Failed to load submissions");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, currentTab, pagination.page, pagination.limit, publicKey]);

  useEffect(() => {
    if (isAdmin) {
      fetchSubmissions();
    }
  }, [isAdmin, fetchSubmissions]);

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const updateSubmissionStatus = async (
    submissionId: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    if (!isAdmin) return;

    setProcessingId(submissionId);
    try {
      const body = {
        wallet: publicKey?.toString(),
        submissionId,
        status,
        ...(status === "REJECTED" && rejectionReason
          ? { rejectionReason }
          : {}),
      };

      const response = await fetch("/api/v1/admin/submission", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error("Failed to update submission status");
      }

      toast.success(`Submission ${status.toLowerCase()} successfully`);

      setSubmissions(submissions.filter((sub) => sub.id !== submissionId));
      setPagination((prev) => ({
        ...prev,
        total: prev.total - 1,
        totalPages: Math.ceil((prev.total - 1) / prev.limit),
      }));

      if (status === "REJECTED") {
        setRejectionReason("");
      }
    } catch (error) {
      console.error("Error updating submission status:", error);
      toast.error("Failed to update submission status");
    } finally {
      setProcessingId(null);
    }
  };

  if (!connected) {
    return (
      <main className="flex-1 bg-[#121313] w-full flex justify-center">
        <Container>
          <div className="text-center py-12">
            <h1 className="text-xl font-semibold text-white mb-4">
              Admin Dashboard
            </h1>
            <p className="text-gray-400 mb-8">
              Please connect your wallet to access the admin dashboard.
            </p>
          </div>
        </Container>
      </main>
    );
  }

  if (connected && publicKey?.toString() !== ADMIN_WALLET) {
    return (
      <main className="flex-1 bg-[#121313] w-full flex justify-center">
        <Container>
          <div className="text-center py-12">
            <h1 className="text-xl font-semibold text-white mb-4">
              Access Denied
            </h1>
            <p className="text-gray-400 mb-8">
              You do not have permission to access the admin dashboard.
            </p>
            <Link href="/" className="text-[#3ecf8e] hover:underline">
              Return to homepage
            </Link>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-[#121313] w-full flex justify-center">
      <Container>
        <div className="py-8">
          <h1 className="text-2xl font-semibold text-white mb-6">
            Admin Dashboard
          </h1>

          <Tabs
            selectedKey={currentTab}
            onSelectionChange={(key) => handleTabChange(key as string)}
            className="w-full"
            classNames={{
              tabList: "gap-0 bg-[#232424] rounded-lg p-1 mb-6",
              tab: [
                "text-gray-400 rounded-md px-4 py-2",
                "data-[selected=true]:bg-[#3ecf8e]",
                "data-[selected=true]:text-black",
                "data-[selected=true]:font-medium",
              ],
            }}
          >
            <Tab
              key="pending"
              title={`Pending (${
                currentTab === "pending" ? pagination.total : "..."
              })`}
            >
              {loading ? (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No pending submissions to review
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {submissions.map((submission) => (
                    <Card
                      key={submission.id}
                      className="bg-[#181919] border-[#7272724f]"
                    >
                      <CardHeader>
                        <CardTitle className="text-[#3ecf8e]">
                          {submission.title}
                        </CardTitle>
                        <CardDescription>
                          Submitted by: {submission.userWallet.slice(0, 6)}...
                          {submission.userWallet.slice(-4)}
                          <br />
                          {new Date(submission.createdAt).toLocaleString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-300 mb-1">
                            Description:
                          </h3>
                          <p className="text-white">{submission.description}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-300 mb-1">
                            Link:
                          </h3>
                          <a
                            href={submission.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline break-all"
                          >
                            {submission.link}
                          </a>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-300 mb-1">
                            Location:
                          </h3>
                          <p className="text-white">
                            {typeof submission.geolocation === "object"
                              ? submission.geolocation.formattedAddress
                              : "Location data unavailable"}
                          </p>
                        </div>

                        {currentTab === "pending" && (
                          <div className="pt-4">
                            <h3 className="text-sm font-medium text-gray-300 mb-1">
                              Rejection Reason (optional):
                            </h3>
                            <Textarea
                              placeholder="Provide a reason if rejecting this submission..."
                              className="bg-[#232424] border-[#7272724f] text-white"
                              value={
                                submission.id === processingId
                                  ? rejectionReason
                                  : ""
                              }
                              onChange={(
                                e: React.ChangeEvent<HTMLTextAreaElement>
                              ) =>
                                submission.id === processingId &&
                                setRejectionReason(e.target.value)
                              }
                              onClick={() => setProcessingId(submission.id)}
                            />
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-end gap-4">
                        {currentTab === "pending" && (
                          <>
                            <Button
                              variant="bordered"
                              disabled={processingId !== null}
                              onClick={() =>
                                updateSubmissionStatus(
                                  submission.id,
                                  "REJECTED"
                                )
                              }
                            >
                              {processingId === submission.id ? (
                                <Spinner size="sm" />
                              ) : (
                                "Reject"
                              )}
                            </Button>
                            <Button
                              className="bg-[#3ecf8e] hover:bg-[#35b57c] text-black"
                              disabled={processingId !== null}
                              onClick={() =>
                                updateSubmissionStatus(
                                  submission.id,
                                  "APPROVED"
                                )
                              }
                            >
                              {processingId === submission.id ? (
                                <Spinner size="sm" />
                              ) : (
                                "Approve"
                              )}
                            </Button>
                          </>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}

              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-8 gap-2">
                  <Button
                    variant="bordered"
                    disabled={pagination.page === 1 || loading}
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page - 1,
                      }))
                    }
                    className="bg-[#232424] border-[#7272724f] text-white"
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-gray-400">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="bordered"
                    disabled={
                      pagination.page === pagination.totalPages || loading
                    }
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }))
                    }
                    className="bg-[#232424] border-[#7272724f] text-white"
                  >
                    Next
                  </Button>
                </div>
              )}
            </Tab>

            <Tab key="approved" title="Approved">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No approved submissions to show
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {submissions.map((submission) => (
                    <Card
                      key={submission.id}
                      className="bg-[#181919] border-[#7272724f]"
                    >
                      <CardHeader>
                        <CardTitle className="text-[#3ecf8e]">
                          {submission.title}
                        </CardTitle>
                        <CardDescription>
                          Submitted by: {submission.userWallet.slice(0, 6)}...
                          {submission.userWallet.slice(-4)}
                          <br />
                          {new Date(submission.createdAt).toLocaleString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-300 mb-1">
                            Description:
                          </h3>
                          <p className="text-white">{submission.description}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-300 mb-1">
                            Link:
                          </h3>
                          <a
                            href={submission.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline break-all"
                          >
                            {submission.link}
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-8 gap-2">
                  <Button
                    variant="bordered"
                    disabled={pagination.page === 1 || loading}
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page - 1,
                      }))
                    }
                    className="bg-[#232424] border-[#7272724f] text-white"
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-gray-400">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="bordered"
                    disabled={
                      pagination.page === pagination.totalPages || loading
                    }
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }))
                    }
                    className="bg-[#232424] border-[#7272724f] text-white"
                  >
                    Next
                  </Button>
                </div>
              )}
            </Tab>

            <Tab key="rejected" title="Rejected">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  No rejected submissions to show
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {submissions.map((submission) => (
                    <Card
                      key={submission.id}
                      className="bg-[#181919] border-[#7272724f]"
                    >
                      <CardHeader>
                        <CardTitle className="text-[#3ecf8e]">
                          {submission.title}
                        </CardTitle>
                        <CardDescription>
                          Submitted by: {submission.userWallet.slice(0, 6)}...
                          {submission.userWallet.slice(-4)}
                          <br />
                          {new Date(submission.createdAt).toLocaleString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-300 mb-1">
                            Description:
                          </h3>
                          <p className="text-white">{submission.description}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-300 mb-1">
                            Link:
                          </h3>
                          <a
                            href={submission.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline break-all"
                          >
                            {submission.link}
                          </a>
                        </div>
                        {submission.rejectionReason && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-300 mb-1">
                              Rejection Reason:
                            </h3>
                            <p className="text-red-400">
                              {submission.rejectionReason}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-8 gap-2">
                  <Button
                    variant="bordered"
                    disabled={pagination.page === 1 || loading}
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page - 1,
                      }))
                    }
                    className="bg-[#232424] border-[#7272724f] text-white"
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 text-gray-400">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="bordered"
                    disabled={
                      pagination.page === pagination.totalPages || loading
                    }
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }))
                    }
                    className="bg-[#232424] border-[#7272724f] text-white"
                  >
                    Next
                  </Button>
                </div>
              )}
            </Tab>
          </Tabs>
        </div>
      </Container>
    </main>
  );
}
