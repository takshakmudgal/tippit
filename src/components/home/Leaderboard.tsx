"use client";

import { useState, useEffect } from "react";
import { ToastNotification } from "@/components/common/ToastNotificationDisplay";
import { MapPin, Trophy, Sparkles } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import type { LeaderboardItem } from "@/types/leaderboard";

const toast = new ToastNotification("leaderboard");

const RankBadge = ({ index }: { index: number }) => {
  if (index > 2) return <div className="text-gray-400">{index + 1}</div>;

  const colors = [
    "bg-gradient-to-b from-yellow-400 to-yellow-600",
    "bg-gradient-to-b from-gray-300 to-gray-500",
    "bg-gradient-to-b from-amber-600 to-amber-800",
  ];

  return (
    <div
      className={`${colors[index]} w-6 h-6 rounded-full flex items-center justify-center shadow-md`}
    >
      <Trophy className="w-2 h-2 text-white fill-current" />
    </div>
  );
};

const SkeletonItem = () => (
  <div className="p-4 bg-[#1a1c1a] rounded-lg border border-[#7272724f] animate-pulse">
    <div className="flex items-center justify-between">
      <div className="h-6 w-6 bg-gray-700 rounded-full" />
      <div className="flex-1 ml-4 space-y-2">
        <div className="h-4 bg-gray-700 rounded w-3/4" />
        <div className="h-3 bg-gray-700 rounded w-1/2" />
      </div>
      <div className="h-4 bg-gray-700 rounded w-16" />
    </div>
  </div>
);

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const response = await fetch("/api/v1/leaderboard?limit=10");
        if (!response.ok) throw new Error("Failed to fetch leaderboard data");
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

  const formatTipAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-gradient-to-br from-[#3ecf8e] to-[#2f9b6e] rounded-lg shadow-lg">
          <Trophy className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
          <p className="text-sm text-gray-400 mt-1">
            Top projects by community contributions
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <SkeletonItem key={i} />
          ))}
        </div>
      ) : (
        <AnimatePresence>
          {leaderboard.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12 text-gray-400 bg-[#181919] rounded-lg border border-[#7272724f] p-6"
            >
              <Sparkles className="mx-auto h-12 w-12 mb-4 text-[#3ecf8e] opacity-50" />
              <p className="text-lg">No projects have been tipped yet.</p>
              <p className="mt-2">
                Be the first to tip a project and start the leaderboard!
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {leaderboard.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#3ecf8e10] to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg -z-10" />
                  <Link
                    href={`/tips/${item.id}`}
                    className="flex items-center justify-between p-3 gap-4 bg-[#1a1c1a] rounded-lg border border-[#7272724f] hover:border-[#3ecf8e30] transition-all"
                  >
                    <div className="flex items-center flex-1">
                      <RankBadge index={index} />
                      <div className="ml-2">
                        <h3 className="text-white font-medium hover:text-[#3ecf8e] transition-colors text-xs sm:text-sm">
                          {item.title}
                        </h3>
                        <div className="flex text-xs text-gray-400">
                          <MapPin className="h-4 w-4 mr-1 text-[#3ecf8e]" />
                          <span>{item.region}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-sm text-gray-400">Tips</div>
                        <div className="text-white font-medium">
                          {item.tipCount}
                        </div>
                      </div>
                      <div className="w-px h-8 bg-[#7272724f]" />
                      <div className="text-center">
                        <div className="text-sm text-gray-400">Amount</div>
                        <div className="text-[#3ecf8e] font-bold">
                          {formatTipAmount(item.currentTips)}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
