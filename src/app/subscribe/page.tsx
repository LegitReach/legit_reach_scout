"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, Zap, Shield, Star, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import styles from './subscribe.module.css';
import posthog from 'posthog-js';

function SubscribeContent() {
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();
    const canceled = searchParams.get('canceled');
    const success = searchParams.get('success');

    const handleSubscribe = async () => {
        posthog.capture("checkout_initiated", { plan: "credits_topup", amount_usd: 1, credits: 5 });
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
            {/* Background blobs for premium look */}
            <div className={styles.blob1} />
            <div className={styles.blob2} />

            <div className={styles.content}>
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        Limit Reached.
                    </h1>
                    <p className={styles.subtitle}>
                        You've used your 5 free daily requests. Get more credits to continue scouting.
                    </p>

                    {success && (
                        <div className={styles.successMessage}>
                            <CheckCircle2 size={20} />
                            <span>Payment successful! Your credits have been added.</span>
                        </div>
                    )}

                    {canceled && (
                        <div className={styles.errorMessage}>
                            <AlertCircle size={20} />
                            <span>Payment was canceled or failed. Please try again if you still need credits.</span>
                        </div>
                    )}
                </div>

                <div className={styles.pricingGrid}>
                    {/* Subscription Card */}
                    <div className={styles.cardWrapper}>
                        <div className={styles.glow}></div>
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div>
                                    <h3 className={styles.planName}>Credits Top-up</h3>
                                    <p className={styles.featureText}>Instant access to more results</p>
                                </div>
                                <div className={styles.planTag}>
                                    Popular
                                </div>
                            </div>

                            <div className={styles.priceContainer}>
                                <span className={styles.price}>$1</span>
                                <span className={styles.period}>/ 5 requests</span>
                            </div>

                            <ul className={styles.featuresList}>
                                {[
                                    '5 premium AI-powered requests',
                                    'Advanced subreddit scouting',
                                    'No expiration on credits',
                                    'Instant credit activation',
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
                                    'Get 5 more requests'
                                )}
                            </button>
                        </div>
                    </div>
                </div>

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
