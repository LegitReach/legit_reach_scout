/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect } from "react";
import styles from "./terminal.module.css";

interface Props {
  redditLoading: boolean;
  newsLoading: boolean;
  brandName: string;
}

// ── Poll Questions (thumbs up/down + simple choices) ──
const POLLS = [
  {
    id: "manage_social",
    question: "Do you currently manage your brand's social media in-house?",
    type: "thumbs" as const,
  },
  {
    id: "reddit_active",
    question: "Have you ever engaged with customers on Reddit?",
    type: "thumbs" as const,
  },
  {
    id: "biggest_channel",
    question: "What drives most of your revenue?",
    type: "choice" as const,
    options: [
      { label: "Organic", emoji: "🌱" },
      { label: "Paid Ads", emoji: "📢" },
      { label: "Email/SMS", emoji: "📧" },
      { label: "Social", emoji: "📱" },
    ],
  },
  {
    id: "top_priority",
    question: "What's your top priority this quarter?",
    type: "choice" as const,
    options: [
      { label: "Growth", emoji: "📈" },
      { label: "Retention", emoji: "🔁" },
      { label: "New Product", emoji: "🚀" },
      { label: "Cost Cut", emoji: "✂️" },
    ],
  },
];

// ── Progress Steps ──
const STEPS = [
  { key: "connect", label: "Connecting to brand profile..." },
  { key: "reddit", label: "Deploying Reddit agent..." },
  { key: "news", label: "Scanning news & trends..." },
  { key: "terminal", label: "Initializing terminal..." },
];

export default function LoadingScreen({
  redditLoading,
  newsLoading,
  brandName,
}: Props) {
  const [currentPollIndex, setCurrentPollIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showThanks, setShowThanks] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Restore answers from localStorage so we don't ask the same questions again
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lr_poll_answers");
      if (saved) {
        const parsed = JSON.parse(saved);
        setAnswers(parsed);
        // Advance poll index past answered questions
        let nextIndex = 0;
        for (let i = 0; i < POLLS.length; i++) {
          if (parsed[POLLS[i].id]) {
            nextIndex = i + 1;
          } else {
            break;
          }
        }
        setCurrentPollIndex(nextIndex);
      }
    } catch {}
  }, []);

  // Advance progress steps
  useEffect(() => {
    // Step 0: connect (always completes fast)
    const t1 = setTimeout(() => setActiveStep(1), 800);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (!redditLoading && activeStep < 2) setActiveStep(2);
  }, [redditLoading]);

  useEffect(() => {
    if (!newsLoading && activeStep < 3) setActiveStep(3);
  }, [newsLoading]);

  useEffect(() => {
    if (!redditLoading && !newsLoading) {
      const t = setTimeout(() => setActiveStep(4), 400);
      return () => clearTimeout(t);
    }
  }, [redditLoading, newsLoading]);

  // Handle poll answer
  const handleAnswer = (pollId: string, answer: string) => {
    const updated = { ...answers, [pollId]: answer };
    setAnswers(updated);
    setShowThanks(true);

    // Save to localStorage for future use
    try {
      localStorage.setItem("lr_poll_answers", JSON.stringify(updated));
    } catch {}

    // Advance to next poll after brief delay
    setTimeout(() => {
      setShowThanks(false);
      setCurrentPollIndex((prev) => prev + 1);
    }, 1200);
  };

  const currentPoll =
    currentPollIndex < POLLS.length ? POLLS[currentPollIndex] : null;

  return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingContent}>
        {/* Logo */}
        <div className={styles.bootLogo}>LegitReach</div>
        <div className={styles.bootSubtitle}>
          Initializing EMS Terminal for {brandName}
        </div>

        {/* Progress Steps */}
        <div className={styles.progressSteps}>
          {STEPS.map((step, i) => {
            const isDone = i < activeStep;
            const isActive = i === activeStep;
            return (
              <div
                key={step.key}
                className={`${styles.progressStep} ${isActive ? styles.active : ""} ${isDone ? styles.done : ""}`}
              >
                <div
                  className={`${styles.stepIcon} ${isDone ? styles.done : isActive ? styles.active : styles.pending}`}
                >
                  {isDone ? "✓" : isActive ? "◌" : "·"}
                </div>
                <span
                  className={`${styles.stepLabel} ${isActive ? styles.active : ""}`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Poll Section */}
        {currentPoll && (
          <div className={styles.pollSection}>
            <div className={styles.pollQuestion}>{currentPoll.question}</div>

            {currentPoll.type === "thumbs" ? (
              <div className={styles.pollOptions}>
                <button
                  className={`${styles.pollBtn} ${answers[currentPoll.id] === "yes" ? styles.selected : ""}`}
                  onClick={() => handleAnswer(currentPoll.id, "yes")}
                  disabled={!!answers[currentPoll.id]}
                >
                  <span className={styles.pollBtnIcon}>👍</span>
                  <span className={styles.pollBtnLabel}>Yes</span>
                </button>
                <button
                  className={`${styles.pollBtn} ${answers[currentPoll.id] === "no" ? styles.selected : ""}`}
                  onClick={() => handleAnswer(currentPoll.id, "no")}
                  disabled={!!answers[currentPoll.id]}
                >
                  <span className={styles.pollBtnIcon}>👎</span>
                  <span className={styles.pollBtnLabel}>No</span>
                </button>
              </div>
            ) : (
              <div className={styles.pollOptions}>
                {currentPoll.options?.map((opt) => (
                  <button
                    key={opt.label}
                    className={`${styles.pollBtn} ${answers[currentPoll.id] === opt.label ? styles.selected : ""}`}
                    onClick={() => handleAnswer(currentPoll.id, opt.label)}
                    disabled={!!answers[currentPoll.id]}
                  >
                    <span className={styles.pollBtnIcon}>{opt.emoji}</span>
                    <span className={styles.pollBtnLabel}>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}

            {showThanks && (
              <div className={styles.pollThanks}>✓ Got it, thanks!</div>
            )}

            <div className={styles.pollCounter}>
              {currentPollIndex + 1} / {POLLS.length} · all optional
            </div>
          </div>
        )}

        {/* All polls answered */}
        {!currentPoll && (
          <div className={styles.pollSection}>
            <div className={styles.pollQuestion}>
              Almost there — building your terminal...
            </div>
            <div className={styles.loadingDots}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
