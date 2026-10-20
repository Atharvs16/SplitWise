import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Silent refresh on app mount to get token securely from HttpOnly cookie
  useEffect(() => {
    const refreshSession = async () => {
      try {
        const response = await fetch('/api/auth/refresh-token', {
          method: 'POST',
          credentials: 'include', // Crucial for sending secure cookies
        });

        if (response.ok) {
          const data = await response.json();
          setAccessToken(data.accessToken);
        }
      } catch (err) {
        console.error("Session restoration failed:", err);
      } finally {
        setLoading(false);
      }
    };

    refreshSession();
  }, []);

  const login = (token) => setAccessToken(token);
  const signup = (token) => setAccessToken(token);
  const logout = () => {
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ accessToken, setAccessToken, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}


export const useAuth = () => useContext(AuthContext);
