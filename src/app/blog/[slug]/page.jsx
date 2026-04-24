import { getPostBySlug, getAllPosts } from '../../../lib/blog';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, ArrowLeft, Tag } from 'lucide-react';

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  return {
    title: `${post.title} | Блог Store Olivka`,
    description: post.description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      images: [{ url: post.coverImage, width: 800, height: 800 }],
      type: 'article',
      publishedTime: post.date,
    },
  };
}

const mdxComponents = {
  h2: (props) => <h2 className="article-h2" {...props} />,
  h3: (props) => <h3 className="article-h3" {...props} />,
  p: (props) => <p className="article-p" {...props} />,
  ul: (props) => <ul className="article-ul" {...props} />,
  li: (props) => <li className="article-li" {...props} />,
  strong: (props) => <strong className="article-strong" {...props} />,
  blockquote: (props) => <blockquote className="article-blockquote" {...props} />,
  table: (props) => <div className="article-table-wrap"><table className="article-table" {...props} /></div>,
  th: (props) => <th className="article-th" {...props} />,
  td: (props) => <td className="article-td" {...props} />,
};

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  console.log('Searching for post with slug:', slug);
  const post = getPostBySlug(slug);

  if (!post) {
    console.log('Post not found for slug:', slug);
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    image: `https://olivka.store${post.coverImage}`,
    datePublished: post.date,
    author: { '@type': 'Organization', name: 'Store Olivka' },
    publisher: {
      '@type': 'Organization',
      name: 'Store Olivka',
      logo: { '@type': 'ImageObject', url: 'https://olivka.store/favicon.svg' },
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="article-page">
        <div className="article-container">

          {/* Breadcrumb */}
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Головна</Link>
            <span>/</span>
            <Link href="/blog">Блог</Link>
            <span>/</span>
            <span>{post.title}</span>
          </nav>

          {/* Header */}
          <header className="article-header">
            <div className="article-meta">
              <div className="article-meta-item">
                <Clock size={14} />
                <span>{post.readingTime} хв читання</span>
              </div>
              {post.tags.map((tag) => (
                <div key={tag} className="article-meta-item">
                  <Tag size={12} />
                  <span>{tag}</span>
                </div>
              ))}
            </div>

            <h1 className="article-title">{post.title}</h1>
            <p className="article-desc">{post.description}</p>
          </header>

          {/* Cover image */}
          <div className="article-cover">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              priority
              style={{ objectFit: 'cover', objectPosition: 'center' }}
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>

          {/* Content */}
          <article className="article-content">
            <MDXRemote source={post.content} components={mdxComponents} />
          </article>

          {/* Related categories */}
          {post.relatedCategories?.length > 0 && (
            <div className="article-related">
              <h2 className="article-related-title">Дивіться також у каталозі</h2>
              <div className="article-related-links">
                {post.relatedCategories.map((cat) => (
                  <Link key={cat.slug} href={`/category/${cat.slug}`} className="article-related-btn">
                    {cat.label || cat.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Related products categories */}
          {post.relatedProducts?.length > 0 && (
            <div className="article-related">
              <h2 className="article-related-title">Товари зі статті</h2>
              <div className="article-related-links">
                {post.relatedProducts.map((p) => (
                  <Link key={p.slug} href={`/category/${p.slug}`} className="article-related-btn">
                    {p.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Back link */}
          <div className="article-back">
            <Link href="/blog" className="article-back-link">
              <ArrowLeft size={16} />
              Всі статті
            </Link>
          </div>

        </div>
      </main>
    </>
  );
}
