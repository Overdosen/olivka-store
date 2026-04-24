import { getAllPosts } from '../../lib/blog';
import BlogCard from '../../components/blog/BlogCard';
import Link from 'next/link';

export const metadata = {
  title: 'Блог для мам | Store Olivka',
  description: 'Корисні статті про догляд за немовлятами, вибір одягу та підготовку до пологів від команди Store Olivka.',
  alternates: { canonical: '/blog' },
  openGraph: {
    title: 'Блог для мам | Store Olivka',
    description: 'Поради щодо вибору одягу для новонароджених, підготовки до пологів та догляду за малюком.',
    type: 'website',
  },
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="blog-page">
      <section className="blog-hero">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Головна</Link>
            <span>/</span>
            <span>Блог</span>
          </nav>
          <h1 className="blog-hero-title">Поради для мам</h1>
          <p className="blog-hero-desc">
            Корисні статті про вибір одягу, підготовку до пологів та перші місяці з малюком
          </p>
        </div>
      </section>

      <section className="section container">
        <div className="blog-grid">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </main>
  );
}
