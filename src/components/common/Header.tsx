"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Wallet } from "lucide-react";

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton
    ),
  { ssr: false }
);

export const Header = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex justify-center">
      <div className="flex justify-between h-16 bg-[#121313] border border-[#cbd5e13a] border-opacity-30 rounded-full px-5 items-center w-[95vw] mt-2">
        <Link
          href="/"
          className="text-white font-semibold text-2xl flex flex-row gap-2"
        >
          <Wallet
            size={32}
            color="#ffffff"
            strokeWidth={0.75}
            absoluteStrokeWidth
            className="hover:scale-125 duration-700"
          />
          tippit
        </Link>
        <WalletMultiButton
          style={{
            background: "#3a0861",
            border: "1px solid #cbd5e17a",
            height: "40px",
            borderRadius: "8px",
          }}
        />
      </div>
    </div>
  );
};
