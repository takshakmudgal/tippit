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
      <div className="flex flex-col items-center justify-between">
        <span className="leading-tight font-semibold text-[#3ecf8e] text-lg sm:text-2xl lg:text-4xl flex flex-col md:flex-row justify-center items-center text-center text-nowrap">
          <span>Fuel innovation & passion,</span>
          <span>
            by tipping{" "}
            <span
              className={`inline-block transition-opacity duration-500 ${
                isVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              {Phrases[currentPhraseIndex]}
            </span>
            .
          </span>
        </span>
      </div>
      <SubmissionList />
    </Container>
  );
}
