import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize from localStorage for persistence
  useEffect(() => {
    const savedCart = localStorage.getItem('olivka_cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart items', e);
      }
    }
    setIsLoaded(true);
  }, []);
  
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Save to localStorage whenever cartItems change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('olivka_cart', JSON.stringify(cartItems));
    }
  }, [cartItems, isLoaded]);

  const addToCart = useCallback((product, selectedSize, quantity = 1) => {
    // Визначаємо ліміт залишку для даного товару/розміру
    let stockLimit = product.stock;
    if (selectedSize && product.sizes) {
      const sizeObj = product.sizes.find(s => s.name === selectedSize);
      if (sizeObj) stockLimit = sizeObj.quantity;
    }

    setCartItems((prev) => {
      const existing = prev.find(
        (item) => item.id === product.id && item.size === selectedSize
      );
      if (existing) {
        // Перевірка ліміту: не додавати більше ніж є на складі
        const currentQty = existing.quantity;
        const availableToAdd = (stockLimit ?? Infinity) - currentQty;
        
        if (availableToAdd <= 0) return prev;
        
        const qtyToAdd = Math.min(quantity, availableToAdd);
        return prev.map((item) =>
          item.id === product.id && item.size === selectedSize
            ? { ...item, quantity: item.quantity + qtyToAdd, stock: stockLimit }
            : item
        );
      }
      return [...prev, { ...product, size: selectedSize, quantity, stock: stockLimit }];
    });
  }, []);

  const removeFromCart = useCallback((productId, size) => {
    setCartItems((prev) =>
      prev.filter((item) => !(item.id === productId && item.size === size))
    );
  }, []);

  const updateQuantity = useCallback((productId, size, delta) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === productId && item.size === size) {
          const stockLimit = item.stock ?? Infinity;
          const newQuantity = Math.max(1, Math.min(item.quantity + delta, stockLimit));
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    localStorage.removeItem('olivka_cart');
  }, []);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  const value = useMemo(() => ({
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartCount,
    cartTotal,
    isCartOpen,
    setIsCartOpen,
  }), [
    cartItems, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    cartCount, 
    cartTotal, 
    isCartOpen
  ]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
