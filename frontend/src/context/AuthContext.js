import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { apiRequest } from '../api/client';
import { sessionStorage } from '../storage/session';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null); // { token, user }
  const [ready, setReady] = useState(false);
  const revision = useRef(0);

  const logout = useCallback(async () => {
    revision.current++;
    setSession(null);
    try { await sessionStorage.clear(); } catch (e) { console.warn('No se pudo eliminar la sesión guardada.'); }
  }, []);

  const login = useCallback(async (data) => {
    const next = { token: data.token, user: data.user };
    const loginRevision = ++revision.current;
    await sessionStorage.save(next);
    if (revision.current === loginRevision) setSession(next);
  }, []);

  // Restaura la sesión guardada y comprueba en segundo plano que el token siga vigente.
  useEffect(() => {
    (async () => {
      try {
        const saved = await sessionStorage.read();
        if (saved) {
          const restoredRevision = revision.current;
          setSession(saved);
          apiRequest('/auth/profile', { token: saved.token }).catch((err) => {
            if (err.status === 401 && revision.current === restoredRevision) logout();
          });
        }
      } catch (e) {
        try { await sessionStorage.clear(); } catch { console.warn('No se pudo limpiar la sesión anterior.'); }
      }
      setReady(true);
    })();
  }, [logout]);

  // Petición autenticada: si el servidor rechaza el token, cierra la sesión.
  const api = useCallback(
    async (endpoint, options = {}) => {
      try {
        return await apiRequest(endpoint, { ...options, token: session?.token });
      } catch (err) {
        if (err.code === 'TOKEN_INVALIDO' && session) logout();
        throw err;
      }
    },
    [session, logout]
  );

  const value = useMemo(() => {
    const rol = session?.user?.rol;
    return {
      ready,
      session,
      user: session?.user || null,
      isCliente: rol === 'cliente',
      isStaff: rol === 'trabajador' || rol === 'administrador',
      isAdmin: rol === 'administrador',
      api,
      login,
      logout
    };
  }, [session, ready, api, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
