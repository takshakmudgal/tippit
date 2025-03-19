"use client";

import { useState, useEffect } from "react";
import { ToastNotification } from "@/components/common/ToastNotificationDisplay";
import { Spinner } from "@heroui/react";
import { BarChart2, MapPin, Trophy } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface LeaderboardItem {
  id: string;
  title: string;
  link: string;
  description: string;
  currentTips: number;
  tipJarLimit: number;
  createdAt: string;
  region: string;
  userWallet: string;
  tipCount: number;
}

const toast = new ToastNotification("leaderboard");

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const response = await fetch("/api/v1/leaderboard?limit=10");
        if (!response.ok) {
          throw new Error("Failed to fetch leaderboard data");
        }

        const data = await response.json();
        setLeaderboard(data.leaderboard);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
        toast.error("Failed to load leaderboard data");
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  // Helper function to get medal color based on position
  const getMedalColor = (index: number) => {
    switch (index) {
      case 0:
        return "text-yellow-400"; // Gold
      case 1:
        return "text-gray-400"; // Silver
      case 2:
        return "text-amber-700"; // Bronze
      default:
        return "text-gray-600"; // Others
    }
  };

  const formatTipAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="mt-8 mb-4">
      <div className="flex items-center gap-3 mb-6">
        <Trophy className="h-6 w-6 text-yellow-400" />
        <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Spinner size="md" />
        </div>
      ) : (
        <>
          {leaderboard.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-[#181919] rounded-lg border border-[#7272724f] p-6">
              <BarChart2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg">No projects have been tipped yet.</p>
              <p className="mt-2">
                Be the first to tip a project to see it on the leaderboard!
              </p>
            </div>
          ) : (
            <div className="bg-[#181919] rounded-lg border border-[#7272724f] overflow-hidden">
              <div className="grid grid-cols-12 py-3 px-4 bg-[#232424] font-medium text-sm text-gray-300">
                <div className="col-span-1 flex justify-center">#</div>
                <div className="col-span-5 md:col-span-4">Project</div>
                <div className="hidden md:block md:col-span-3">Region</div>
                <div className="col-span-3 md:col-span-2 text-center">Tips</div>
                <div className="col-span-3 md:col-span-2 text-right">
                  Amount
                </div>
              </div>
              {leaderboard.slice(0, 5).map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`grid grid-cols-12 py-3 px-4 items-center border-t border-[#7272724f] hover:bg-[#1c1d1d] ${
                    index < 3 ? "bg-[#1a1c1a]" : ""
                  }`}
                >
                  <div className="col-span-1 flex justify-center">
                    <div
                      className={`flex items-center justify-center rounded-full w-6 h-6 font-medium ${
                        index < 3
                          ? `${getMedalColor(index)} border border-current`
                          : "text-gray-500"
                      }`}
                    >
                      {index + 1}
                    </div>
                  </div>
                  <div className="col-span-5 md:col-span-4 line-clamp-1 font-medium">
                    <Link
                      href={`/tips/${item.id}`}
                      className="hover:text-[#3ecf8e] transition-colors"
                    >
                      {item.title}
                    </Link>
                  </div>
                  <div className="hidden md:flex md:col-span-3 text-gray-400 items-center text-sm">
                    <MapPin className="h-3 w-3 mr-1 text-[#3ecf8e]" />
                    <span className="line-clamp-1">{item.region}</span>
                  </div>
                  <div className="col-span-3 md:col-span-2 text-center text-gray-400 text-sm">
                    {item.tipCount} tip{item.tipCount !== 1 ? "s" : ""}
                  </div>
                  <div className="col-span-3 md:col-span-2 text-right font-bold text-[#3ecf8e]">
                    {formatTipAmount(item.currentTips)}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
