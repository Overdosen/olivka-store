import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Category from './pages/Category';
import ProductDetails from './pages/ProductDetails';
import CartDrawer from './components/CartDrawer';
import ScrollToTop from './components/ScrollToTop';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Category />} />
        <Route path="/category/:catId" element={<Category />} />
        <Route path="/product/:id" element={<ProductDetails />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <CartProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen">
          <Header />
          <CartDrawer />
          <Toaster 
            position="top-center" 
            toastOptions={{
              style: {
                background: '#fff',
                color: 'var(--color-stone-800)',
                fontFamily: 'Inter, sans-serif',
                borderRadius: '999px',
                padding: '16px 24px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
              }
            }}
          />
          <AnimatedRoutes />
          <Footer />
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
