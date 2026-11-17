import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_KEY = 'electrolab.cart';
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CART_KEY);
        if (raw) setItems(JSON.parse(raw));
      } catch (e) { /* carrito corrupto: se ignora */ }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(CART_KEY, JSON.stringify(items)).catch(() => {});
  }, [items, loaded]);

  // Devuelve { ok, message } para que la pantalla muestre el resultado.
  const add = useCallback((product, qty = 1) => {
    if (product.cantidad <= 0) return { ok: false, message: 'Producto agotado' };
    let result = { ok: true, message: 'Agregado al carrito' };
    setItems((prev) => {
      const existing = prev.find((i) => i.productoId === product._id);
      const current = existing ? existing.cantidad : 0;
      if (current + qty > product.cantidad) {
        result = { ok: false, message: `Solo hay ${product.cantidad} disponibles` };
        return prev;
      }
      if (existing) return prev.map((i) => (i.productoId === product._id ? { ...i, cantidad: current + qty, stock: product.cantidad, precio: product.precio } : i));
      return [...prev, { productoId: product._id, sku: product.sku, nombre: product.nombre, precio: product.precio, cantidad: qty, stock: product.cantidad }];
    });
    return result;
  }, []);

  const setQty = useCallback((productoId, qty) => {
    setItems((prev) =>
      prev.flatMap((i) => {
        if (i.productoId !== productoId) return [i];
        if (qty <= 0) return [];
        return [{ ...i, cantidad: Math.min(qty, i.stock) }];
      })
    );
  }, []);

  const remove = useCallback((productoId) => setItems((prev) => prev.filter((i) => i.productoId !== productoId)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      add,
      setQty,
      remove,
      clear,
      count: items.reduce((sum, i) => sum + i.cantidad, 0),
      total: Math.round(items.reduce((sum, i) => sum + i.precio * i.cantidad, 0) * 100) / 100
    }),
    [items, add, setQty, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
