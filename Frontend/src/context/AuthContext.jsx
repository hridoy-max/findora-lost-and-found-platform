import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/auth";
import { getRefresh, setTokens, clearTokens, initTokenSync } from "../api/tokens";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const isAuthenticated = !!user;
  const isAdmin = user?.role === "admin";

  const applyTokenResponse = (res) => {
    const { access_token, refresh_token, user: userData } = res;
    setTokens({ access_token, refresh_token });
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.error("Logout failed:", err);
    }
    finally {
      clearTokens();
      setUser(null);
      navigate("/");
    }
  };

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    applyTokenResponse(res);
  };

  const register = async (userData) => {
    await authApi.register(userData);
  };

  useEffect(() => {
    const boot = async () => {
      try {
        const refreshTkn = getRefresh();
        if (refreshTkn) {
          const res = await authApi.refresh(refreshTkn);
          applyTokenResponse(res);
        }
      } catch (err) {
        console.error("Token refresh failed:", err);
      } finally {
        setIsLoading(false);
      }
    };
    boot();
    initTokenSync(() => {
      setUser(null);
      navigate("/login");
    });
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isAdmin, isLoading, login, register, logout, applyTokenResponse }}>
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => useContext(AuthContext);