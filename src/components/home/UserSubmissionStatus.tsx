"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@jup-ag/wallet-adapter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@heroui/react";
import { ToastNotification } from "@/components/common/ToastNotificationDisplay";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import Link from "next/link";

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

export default function UserSubmissionStatus() {
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const fetchUserSubmissions = useCallback(async () => {
    if (!connected || !publicKey) return;

    setLoading(true);
    try {
      const wallet = publicKey.toString();
      const response = await fetch(
        `/api/v1/submission?wallet=${wallet}&showAll=true`
      );

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="flex items-center text-green-500">
            <CheckCircle size={14} className="mr-1" /> Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="flex items-center text-red-500">
            <XCircle size={14} className="mr-1" /> Rejected
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="flex items-center text-yellow-500">
            <Clock size={14} className="mr-1" /> Pending Review
          </span>
        );
    }
  };

  if (!connected) {
    return null;
  }

  if (loading) {
    return (
      <Card className="w-full bg-[#181919] border-[#7272724f] shadow-lg mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg">Your Submissions</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Spinner size="md" />
        </CardContent>
      </Card>
    );
  }

  if (submissions.length === 0) {
    return null;
  }

  return (
    <Card className="w-full bg-[#181919] border-[#7272724f] shadow-lg mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-lg">Your Submissions</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {submissions.map((submission) => (
            <li
              key={submission.id}
              className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center border-b border-[#7272724f] pb-3 last:border-b-0 last:pb-0"
            >
              <div>
                <p className="text-white font-medium">
                  <Link
                    href={`/tips/${submission.id}`}
                    className="hover:text-[#3ecf8e] transition-colors"
                  >
                    {submission.title}
                  </Link>
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(submission.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="mt-2 sm:mt-0 flex flex-col items-start sm:items-end">
                {getStatusBadge(submission.status)}
                {submission.status === "REJECTED" &&
                  submission.rejectionReason && (
                    <p className="text-xs text-gray-400 mt-1 max-w-[250px] text-left sm:text-right">
                      Reason: {submission.rejectionReason}
                    </p>
                  )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
