import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import Home from '../pages/Home';
import Category from '../pages/Category';
import ProductDetails from '../pages/ProductDetails';

export default function StoreLayout() {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <CartDrawer />
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Category />} />
            <Route path="/category/:catId" element={<Category />} />
            <Route path="/product/:id" element={<ProductDetails />} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
