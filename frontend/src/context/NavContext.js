import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler } from 'react-native';

// Navegación mínima: 3 pestañas + una pila de pantallas por encima.
const NavContext = createContext(null);

/**
 * Proveedor React de pestañas, pila e intención posterior al login.
 * @param {object} props Propiedades de composición y callbacks definidos en la firma.
 * @returns {React.ReactElement|null} Vista y estados de carga correspondientes.
 */
export function NavProvider({ children }) {
  const [tab, setTab] = useState('home');
  const [stack, setStack] = useState([]);
  const postLogin = useRef(null); // acción pendiente tras iniciar sesión (ej. 'checkout')

  const push = useCallback((name, params = {}) => setStack((s) => [...s, { name, params }]), []);
  const back = useCallback(() => setStack((s) => s.slice(0, -1)), []);
  const goTab = useCallback((key) => { setStack([]); setTab(key); }, []);

  // Pide iniciar sesión y recuerda a dónde volver.
  const requireLogin = useCallback((intent) => { postLogin.current = intent; goTab('profile'); }, [goTab]);

  const finishAuth = useCallback(() => {
    const intent = postLogin.current;
    postLogin.current = null;
    if (intent === 'checkout') {
      setStack([{ name: 'Checkout', params: {} }]);
      setTab('cart');
    } else {
      goTab('profile');
    }
  }, [goTab]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length > 0) { back(); return true; }
      if (tab !== 'home') { setTab('home'); return true; }
      return false;
    });
    return () => sub.remove();
  }, [stack.length, tab, back]);

  const value = useMemo(() => ({ tab, stack, push, back, goTab, requireLogin, finishAuth }), [tab, stack, push, back, goTab, requireLogin, finishAuth]);
  return <NavContext.Provider value={value}>{children}</NavContext.Provider>;
}

export const useNav = () => useContext(NavContext);
