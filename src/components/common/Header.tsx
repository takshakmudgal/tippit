"use client";
import { Container } from "./Container";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { UnifiedWalletButton } from "@jup-ag/wallet-adapter";

export const Header = () => {
  return (
    <Container>
      <header className="flex justify-center">
        <div className="flex justify-between h-16 bg-[#121313] border border-[#3ecf8e33] rounded-full px-5 items-center w-[95vw] animate-pulse-slow">
          <Link
            href="/"
            className="text-white font-semibold text-2xl flex flex-row items-center gap-3 group"
          >
            <div className="relative">
              <Wallet
                size={32}
                color="#3ecf8e"
                strokeWidth={0.75}
                absoluteStrokeWidth
                className="transition-all duration-700 group-hover:scale-110 group-hover:rotate-12"
              />
              <div className="absolute inset-0 bg-[#3ecf8e33] rounded-full blur-md scale-125 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="relative overflow-hidden whitespace-nowrap">
                <span className="block transition-transform duration-300 group-hover:-translate-y-full sm:w-80">
                  tippit
                </span>
                <span className="absolute top-0 left-0 transition-transform duration-300 translate-y-full group-hover:translate-y-0 text-[#3ecf8e] text-lg">
                  community tips, community works.
                </span>
              </span>
            </div>
          </Link>
          <UnifiedWalletButton />
        </div>
      </header>
    </Container>
  );
};
