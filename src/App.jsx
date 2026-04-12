import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import ScrollToTop from './components/ScrollToTop';

// Store Layout (Public)
import StoreLayout from './components/StoreLayout';

// Admin Layout & Pages (Private)
import AdminLayout from './components/admin/AdminLayout';
import ProtectedRoute from './components/admin/ProtectedRoute';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import ProductForm from './pages/admin/ProductForm';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
      <Router>
        <ScrollToTop />
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: '#fff',
              color: 'var(--color-stone-800)',
              fontFamily: 'var(--font-sans)',
              borderRadius: '999px',
              padding: '16px 24px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.08)'
            }
          }}
        />
        
        <Routes>
          {/* Admin Routes */}
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id" element={<ProductForm />} />
          </Route>

          {/* Store Routes (Catch-all) */}
          <Route path="/*" element={<StoreLayout />} />
        </Routes>
      </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
