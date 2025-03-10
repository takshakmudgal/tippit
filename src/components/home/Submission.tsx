"use client";

import { useState, useEffect } from "react";
import { Phrases } from "@/constants/submissions";
import SubmissionList from "./SubmissionList";
import { Container } from "../common/Container";

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
    <Container>
      <div className="w-full text-center pt-3 pb-2 sm:pt-0 sm:-mt-2 md:-mt-8 lg:-mt-12 md:mb-6">
        <h1 className="inline-block text-[#3ecf8e] font-semibold text-xl sm:text-2xl md:text-3xl lg:text-4xl px-2 m-0">
          Fuel innovation & passion,
          <br className="hidden sm:block" />
          <span className="sm:mt-0 inline-block">
            by tipping{" "}
            <span
              className={`transition-opacity duration-500 ${
                isVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              {Phrases[currentPhraseIndex]}.
            </span>
          </span>
        </h1>
      </div>

      <div className="flex flex-col lg:flex-row w-full gap-6">
        <div className="w-full lg:w-3/4">
          <SubmissionList />
        </div>
        <div className="hidden lg:block lg:w-1/4">
          {/* Future component will go here */}
        </div>
      </div>
    </Container>
  );
}
