'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Clock, ArrowRight } from 'lucide-react';

export default function BlogCard({ post, compact = false }) {
  return (
    <Link href={`/blog/${post.slug}`} className="blog-card">
      <div className="blog-card-image-wrap">
        <Image
          src={post.coverImage}
          alt={post.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
          className="blog-card-image"
          style={{ objectFit: 'cover' }}
        />
        {post.tags?.[0] && (
          <span className="blog-card-tag">{post.tags[0]}</span>
        )}
      </div>

      <div className="blog-card-body">
        <div className="blog-card-meta">
          <Clock size={13} />
          <span>{post.readingTime} хв читання</span>
        </div>

        <h3 className="blog-card-title">{post.title}</h3>

        {!compact && (
          <p className="blog-card-desc">{post.description}</p>
        )}

        <span className="blog-card-link">
          Читати статтю <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}
