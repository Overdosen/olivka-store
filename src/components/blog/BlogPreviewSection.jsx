'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BlogPreviewSection({ posts }) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="blog-preview-section">
      <div className="container">
        {/* Header */}
        <div className="blog-preview-header">
          <div className="blog-preview-label">Блог для мам</div>
          <h2 className="blog-preview-title">Корисні поради</h2>
          <p className="blog-preview-subtitle">
            Відповіді на найважливіші питання про одяг, розміри та підготовку до пологів
          </p>
        </div>

        {/* Cards grid */}
        <div className="blog-preview-grid">
          {posts.map((post, i) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link href={`/blog/${post.slug}`} className="blog-preview-card">
                <div className="blog-preview-card-image-wrap">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
                    className="blog-preview-card-image"
                    style={{ objectFit: 'cover' }}
                  />
                  {post.tags?.[0] && (
                    <span className="blog-preview-card-tag">{post.tags[0]}</span>
                  )}
                </div>

                <div className="blog-preview-card-body">
                  <div className="blog-preview-card-meta">
                    <Clock size={13} />
                    <span>{post.readingTime} хв читання</span>
                  </div>
                  <h3 className="blog-preview-card-title">{post.title}</h3>
                  <p className="blog-preview-card-desc">{post.description}</p>
                  <span className="blog-preview-card-link">
                    Читати <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* All articles link */}
        <div className="blog-preview-footer">
          <Link href="/blog" className="blog-preview-all-btn">
            Всі статті
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
