/* eslint-disable react/no-unescaped-entities */
"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Zap, Shield, Star, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import styles from './subscribe.module.css';
import posthog from 'posthog-js';

function SubscribeContent() {
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const router = useRouter();
    const searchParams = useSearchParams();
    const canceled = searchParams.get('canceled');
    const success = searchParams.get('success');

    useEffect(() => {
        if (!success) return;
        if (countdown <= 0) { router.push('/dashboard'); return; }
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [success, countdown, router]);

    const handleSubscribe = async () => {
        posthog.capture("checkout_initiated", { plan: "credits_topup", amount_usd: 79, credits: 30 });
        setIsLoading(true);
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
            });
            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error('Checkout error:', data.error);
                alert('Could not initiate checkout. Please try again.');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            posthog.captureException(error);
            alert('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.content}>
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        You've used your free scans.
                    </h1>
                    <p className={styles.subtitle}>
                        Get 30 scan credits to keep building your Reddit engagement blueprints.
                    </p>

                    {success && (
                        <div className={styles.successMessage}>
                            <CheckCircle2 size={20} />
                            <span>Payment successful! Your 30 credits have been added. Redirecting to dashboard in {countdown}…</span>
                        </div>
                    )}

                    {canceled && (
                        <div className={styles.errorMessage}>
                            <AlertCircle size={20} />
                            <span>Payment was canceled or failed. Please try again if you still need credits.</span>
                        </div>
                    )}
                </div>

                {!success && (
                    <div className={styles.pricingGrid}>
                        {/* Subscription Card */}
                        <div className={styles.cardWrapper}>
                            <div className={styles.glow}></div>
                            <div className={styles.card}>
                                <div className={styles.cardHeader}>
                                    <div>
                                        <h3 className={styles.planName}>30 Scan Credits</h3>
                                        <p className={styles.featureText}>One fresh blueprint per day for 30 days</p>
                                    </div>
                                    <div className={styles.planTag}>
                                        Popular
                                    </div>
                                </div>

                                <div className={styles.priceContainer}>
                                    <span className={styles.price}>$79</span>
                                    <span className={styles.period}>/ 30 scans</span>
                                </div>

                                <ul className={styles.featuresList}>
                                    {[
                                        '30 daily Reddit engagement blueprints',
                                        'Fresh AI analysis every 24 hours',
                                        'Credits never expire',
                                        'Instant activation after payment',
                                    ].map((feature, i) => (
                                        <li key={i} className={styles.feature}>
                                            <Check className={styles.featureIcon} size={18} />
                                            <span className={styles.featureText}>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    className={styles.subscribeBtn}
                                    onClick={handleSubscribe}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className={styles.spinner} size={18} />
                                            Processing...
                                        </>
                                    ) : (
                                        'Get 30 scans — $79'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className={styles.footerInfo}>
                    <div className={styles.infoItem}>
                        <Shield size={14} />
                        <span>Secure Stripe Payment</span>
                    </div>
                    <div className={styles.infoItem}>
                        <Zap size={14} />
                        <span>Instant Access</span>
                    </div>
                    <div className={styles.infoItem}>
                        <Star size={14} />
                        <span>High Quality Results</span>
                    </div>
                </div>

                <Link href="/" className={styles.homeLink}>
                    Return to home
                </Link>
            </div>
        </div>
    );
}

export default function SubscribePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SubscribeContent />
        </Suspense>
    );
}
