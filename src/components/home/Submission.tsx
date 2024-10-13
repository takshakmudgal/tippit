"use client";

import { useState, useEffect } from "react";
import { Phrases } from "@/constants/submissions";

export default function Submission() {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentPhraseIndex((prevIndex) => (prevIndex + 1) % Phrases.length);
        setIsVisible(true);
      }, 500);
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-between">
      <span className="leading-tight font-semibold text-[#3ecf8e] text-xl sm:text-2xl md:text-3xl lg:text-4xl flex flex-col md:flex-row justify-center items-center text-center space-y-2 md:space-y-0 md:space-x-2">
        <div>Fuel innovation & passion,</div>
        <div>
          by tipping{" "}
          <span
            className={`inline-block transition-opacity duration-500 ${
              isVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            {Phrases[currentPhraseIndex]}
          </span>
          .
        </div>
      </span>
    </div>
  );
}
