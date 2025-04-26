"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@jup-ag/wallet-adapter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@heroui/react";
import { ToastNotification } from "@/components/common/ToastNotificationDisplay";
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const toast = new ToastNotification("user-submissions");

interface Submission {
  id: string;
  title: string;
  link: string;
  description: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  createdAt: string;
}

const SkeletonItem = () => (
  <div className="animate-pulse flex flex-col sm:flex-row sm:justify-between items-start sm:items-center border-b border-[#7272724f] pb-3 last:border-b-0 last:pb-0">
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-700 rounded w-3/4" />
      <div className="h-3 bg-gray-800 rounded w-1/3" />
    </div>
    <div className="mt-2 sm:mt-0 space-y-2 w-full sm:w-auto">
      <div className="h-4 bg-gray-700 rounded w-32" />
      <div className="h-3 bg-gray-800 rounded w-48" />
    </div>
  </div>
);

export default function UserSubmissionStatus() {
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [expandedSubmissionId, setExpandedSubmissionId] = useState<
    string | null
  >(null);

  const fetchUserSubmissions = useCallback(async () => {
    if (!connected || !publicKey) return;

    setLoading(true);
    try {
      const wallet = publicKey.toString();
      const response = await fetch(`/api/v1/submission?wallet=${wallet}`);

      if (!response.ok) {
        throw new Error("Failed to fetch your submissions");
      }

      const data = await response.json();
      setSubmissions(data.submissions);
    } catch (error) {
      console.error("Error fetching user submissions:", error);
      toast.error("Failed to load your submissions");
    } finally {
      setLoading(false);
    }
  }, [connected, publicKey]);

  useEffect(() => {
    if (connected && publicKey) {
      fetchUserSubmissions();
    }
  }, [connected, publicKey, fetchUserSubmissions]);

  const toggleDetails = (submissionId: string) => {
    setExpandedSubmissionId((prev) =>
      prev === submissionId ? null : submissionId
    );
  };

  const getStatusBadge = (status: string) => {
    const baseStyle = "px-2 py-1 rounded-md text-sm flex items-center w-fit";

    switch (status) {
      case "APPROVED":
        return (
          <div className={cn(baseStyle, "bg-green-500/20 text-green-400")}>
            <CheckCircle size={14} className="mr-1.5" />
            Approved
          </div>
        );
      case "REJECTED":
        return (
          <div className={cn(baseStyle, "bg-red-500/20 text-red-400")}>
            <XCircle size={14} className="mr-1.5" />
            Rejected
          </div>
        );
      case "PENDING":
      default:
        return (
          <div className={cn(baseStyle, "bg-yellow-500/20 text-yellow-400")}>
            <Clock size={14} className="mr-1.5" />
            Pending Review
          </div>
        );
    }
  };

  if (!connected) return null;

  return (
    <Card className="w-full bg-[#181919] border-[#7272724f] shadow-lg mb-6 animate-in fade-in">
      <CardHeader className="pb-2 border-b border-[#7272724f]">
        <CardTitle className="text-white text-lg flex items-center">
          <FileText className="h-5 w-5 mr-2 text-[#3ecf8e]" />
          Your Submissions
          {loading && <Spinner size="sm" className="ml-2 text-[#3ecf8e]" />}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <SkeletonItem key={i} />
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div className="py-6 flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-12 w-12 text-gray-500 mb-3" />
            <p className="text-gray-400">No submissions found</p>
            <p className="text-sm text-gray-500 mt-1">
              Create your first submission to get started
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {submissions.map((submission) => (
              <li
                key={submission.id}
                className="group flex flex-col sm:flex-row sm:justify-between items-start sm:items-center border-b border-[#7272724f] pb-3 last:border-b-0 last:pb-0 transition-colors px-2 -mx-2 rounded"
              >
                <div className="flex-1 w-full">
                  <button
                    onClick={() => toggleDetails(submission.id)}
                    className="text-left w-full"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium hover:text-[#3ecf8e] transition-colors line-clamp-1">
                        {submission.title}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Submitted{" "}
                      {new Date(submission.createdAt).toLocaleDateString()}
                    </p>
                  </button>

                  {expandedSubmissionId === submission.id && (
                    <div className="mt-3 space-y-2 animate-in fade-in">
                      <div className="text-sm text-gray-300">
                        <p className="font-medium mb-1">Description:</p>
                        <p className="text-gray-400">
                          {submission.description}
                        </p>
                      </div>

                      <div className="flex items-center text-sm text-[#3ecf8e]">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        <a
                          href={submission.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline break-all"
                        >
                          {submission.link}
                        </a>
                      </div>

                      {submission.status === "REJECTED" &&
                        submission.rejectionReason && (
                          <div className="text-xs text-red-300 mt-2 p-2 bg-[#2a1a1a] border border-red-500/20 rounded-md">
                            <AlertCircle className="h-4 w-4 mr-1.5 inline-block" />
                            {submission.rejectionReason}
                          </div>
                        )}
                    </div>
                  )}
                </div>

                <div className="mt-2 sm:mt-0 flex flex-col items-start sm:items-end gap-1.5">
                  {getStatusBadge(submission.status)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
