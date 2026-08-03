'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ReviewModal from './ReviewModal';

const InstagramIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export default function StoreReviews() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dbReviews, setDbReviews] = useState([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('review') === 'true') {
        setIsReviewModalOpen(true);
      }
    }
  }, []);

  useEffect(() => {
    async function fetchReviews() {
      try {
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('is_approved', true)
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false });
        if (!error && data) {
          setDbReviews(data);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      }
    }
    fetchReviews();
  }, []);

  const sortedReviews = useMemo(() => {
    return dbReviews.map(r => ({
      id: `db-${r.id}`,
      text: r.text,
      author: r.name,
      rating: r.rating,
      isInstagram: r.is_instagram
    }));
  }, [dbReviews]);

  const displayedReviews = isExpanded ? sortedReviews : sortedReviews.slice(0, 4);

  return (
    <section className="store-reviews-section">
      <div className="container">
        <div className="reviews-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="header-left">
            <h2 className="reviews-title">Що про нас кажуть мами</h2>
          </div>
          <div className="header-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button 
              onClick={() => setIsReviewModalOpen(true)}
              className="leave-review-btn"
            >
              <Star size={14} fill="#524f25" color="#524f25" />
              Залишити відгук
            </button>
            <div className="aggregate-rating">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
              <span className="rating-text">5/5 • {76 + dbReviews.length}+ відгуків</span>
            </div>
          </div>
        </div>

        <div className="reviews-grid">
          <AnimatePresence initial={false}>
            {displayedReviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10, transition: { duration: 0.15 } }}
                transition={{
                  duration: 0.25,
                  ease: "easeOut"
                }}
                className="review-bubble"
              >
                <div className="bubble-content">
                  <div className="review-stars">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={14} 
                        fill={i < review.rating ? "#f59e0b" : "transparent"} 
                        color={i < review.rating ? "#f59e0b" : "#d6d3d1"} 
                      />
                    ))}
                  </div>
                  <p className="review-text">{review.text}</p>
                </div>
                <div className="bubble-footer">
                  {review.isInstagram ? (
                    <span className="review-instagram-badge">
                      <InstagramIcon className="instagram-icon" style={{ width: 14, height: 14 }} />
                      Відгук з Instagram
                    </span>
                  ) : (
                    <span className="review-author">{review.author || 'Клієнт'}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="reviews-footer">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn-expand"
          >
            {isExpanded ? (
              <>Згорнути <ChevronUp size={18} /></>
            ) : (
              <>Читати всі відгуки <ChevronDown size={18} /></>
            )}
          </button>
        </div>
      </div>

      <ReviewModal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} />

      {/* SEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Store Olivka",
            "url": "https://olivka.store",
            "logo": "https://olivka.store/logo.png",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "5.0",
              "reviewCount": String(76 + dbReviews.length)
            },
            "review": sortedReviews.map(r => ({
              "@type": "Review",
              "author": {
                "@type": "Person",
                "name": r.isInstagram ? "Відгук з Instagram" : (r.author || "Клієнт Store Olivka")
              },
              "reviewBody": r.text,
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": String(r.rating)
              }
            }))
          }).replace(/</g, '\\u003c')
        }}
      />
    </section>
  );
}
