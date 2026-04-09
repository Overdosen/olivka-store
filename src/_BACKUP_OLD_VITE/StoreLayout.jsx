import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import Home from '../pages/Home';
import Category from '../pages/Category';
import CatalogGrid from '../pages/CatalogGrid';
import ProductDetails from '../pages/ProductDetails';
import AboutPage from '../pages/AboutPage';
import AccountPage from '../pages/AccountPage';

export default function StoreLayout() {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <CartDrawer />
      <main className="flex-grow" style={{ position: 'relative' }}>
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<CatalogGrid />} />
            <Route path="/category/:catId" element={<Category />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/account" element={<AccountPage />} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
