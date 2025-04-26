import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-[#3ecf8e20] rounded-full blur-xl scale-[2.5] "></div>
        <Image
          src="/tippit-logo.png"
          alt="tippit"
          width={80}
          height={80}
          className="transition-all duration-700 group-hover:scale-125 group-hover:rotate-12"
        />
      </div>

      <h1 className="text-6xl font-bold text-white mb-2">404</h1>
      <h2 className="text-3xl font-semibold text-[#3ecf8e] mb-6">
        Page Not Found
      </h2>

      <p className="text-gray-400 mb-8 max-w-md">
        Oops! It seems the page you&apos;re looking for doesn&apos;t exist or
        has been moved.
      </p>

      <Link
        href="/"
        className="flex items-center gap-2 px-6 py-3 bg-[#121313] border border-[#3ecf8e33] text-white rounded-full hover:bg-[#1a1a1a] transition-all group animate-pulse-slow"
      >
        <ArrowLeft
          size={18}
          className="text-[#3ecf8e] group-hover:-translate-x-1 transition-transform"
        />
        <span>Back to Homepage</span>
      </Link>
    </div>
  );
}
