"use client";
import { Container } from "./Container";
import Link from "next/link";
import { UnifiedWalletButton } from "@jup-ag/wallet-adapter";
import Image from "next/image";

export const Header = () => {
  return (
    <Container>
      <header className="flex justify-center relative z-10">
        <div className="flex justify-between h-16 bg-[#121313] border border-[#3ecf8e33] rounded-full px-5 items-center w-[95vw] animate-pulse-slow">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-white font-semibold text-2xl flex flex-row items-center gap-1 group"
            >
              <div className="relative">
                <Image
                  src="/tippit-logo.png"
                  alt="tippit"
                  width={40}
                  height={40}
                  className="transition-all duration-700 group-hover:scale-125 group-hover:rotate-12"
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
          </div>

          <UnifiedWalletButton />
        </div>
      </header>
    </Container>
  );
};
