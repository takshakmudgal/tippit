"use client";

import { useState, useEffect } from "react";
import { Phrases } from "@/constants/submissions";
import SubmissionList from "./SubmissionList";
import CreateSubmission from "./CreateSubmission";
import UserSubmissionStatus from "./UserSubmissionStatus";
import Leaderboard from "./Leaderboard";
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
      <div className="w-full text-center pt-3 pb-6 sm:pt-0 sm:-mt-2 md:-mt-8 lg:-mt-12 mb-8 md:mb-2">
        <div
          style={{ height: "5rem" }}
          className="sm:h-auto flex items-start justify-center pt-[0.5rem] sm:pt-0 sm:items-center md:my-4"
        >
          <h1 className="inline-block text-[#3ecf8e] font-semibold text-xl sm:text-2xl md:text-3xl lg:text-5xl px-2 m-0">
            Fuel innovation & passion,&nbsp;
            <br className="hidden sm:block" />
            <span className="inline-block">
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
      </div>
      <div className="hidden lg:flex flex-row  md:space-x-10">
        <CreateSubmission />
        <SubmissionList />
        <Leaderboard />
        <UserSubmissionStatus />
      </div>
      <div className="flex flex-col lg:hidden space-y-6">
        <SubmissionList />
        <Leaderboard />
        <UserSubmissionStatus />
        <CreateSubmission />
      </div>
    </Container>
  );
}
