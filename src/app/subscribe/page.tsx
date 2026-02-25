import React from 'react';
import Link from 'next/link';
import { Check, Zap, Shield, Star } from 'lucide-react';
import styles from './subscribe.module.css';

export default function SubscribePage() {
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
                        You've reached your daily limit. Subscribe to unlock unlimited access and premium features.
                    </p>
                </div>

                <div className={styles.pricingGrid}>
                    {/* Subscription Card */}
                    <div className={styles.cardWrapper}>
                        <div className={styles.glow}></div>
                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div>
                                    <h3 className={styles.planName}>Pro Plan</h3>
                                    <p className={styles.featureText}>Unlock your full potential</p>
                                </div>
                                <div className={styles.planTag}>
                                    Popular
                                </div>
                            </div>

                            <div className={styles.priceContainer}>
                                <span className={styles.price}>$29</span>
                                <span className={styles.period}>/month</span>
                            </div>

                            <ul className={styles.featuresList}>
                                {[
                                    'Unlimited AI generation',
                                    'Advanced subreddit scouting',
                                    'Priority support',
                                    'Early access to new features',
                                ].map((feature, i) => (
                                    <li key={i} className={styles.feature}>
                                        <Check className={styles.featureIcon} size={18} />
                                        <span className={styles.featureText}>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <button className={styles.subscribeBtn}>
                                Subscribe for more!
                            </button>
                        </div>
                    </div>
                </div>

                <div className={styles.footerInfo}>
                    <div className={styles.infoItem}>
                        <Shield size={14} />
                        <span>Secure Payment</span>
                    </div>
                    <div className={styles.infoItem}>
                        <Zap size={14} />
                        <span>Instant Access</span>
                    </div>
                    <div className={styles.infoItem}>
                        <Star size={14} />
                        <span>Cancel Anytime</span>
                    </div>
                </div>

                <Link href="/" className={styles.homeLink}>
                    Return to home
                </Link>
            </div>
        </div>
    );
}
