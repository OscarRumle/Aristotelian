import { createContext, useContext, useState } from "react";

const AUTH_KEY = "aristotelian-user";
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY) || "null"); } catch { return null; }
  });
  const [loginOpen, setLoginOpen] = useState(false);

  const login = (email) => {
    const u = { email, name: email.split("@")[0].replace(/\./g, " "), plan: "Quill" };
    setUser(u);
    localStorage.setItem(AUTH_KEY, JSON.stringify(u));
    setLoginOpen(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loginOpen, setLoginOpen }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function LoginModal() {
  const { loginOpen, setLoginOpen, login } = useAuth();
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState("signin");

  if (!loginOpen) return null;

  return (
    <div className="modal-overlay" onClick={() => setLoginOpen(false)}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-x" onClick={() => setLoginOpen(false)} aria-label="Close">✕</button>
        <div className="modal-head">
          <div className="modal-eyebrow">Aristotelian</div>
          <h2 className="modal-title">{mode === "signin" ? "Welcome back" : "Create account"}</h2>
          <p className="modal-sub">
            {mode === "signin"
              ? "Continue building characters with dramatic structure."
              : "Free tier — 20 credits to start. No card needed."}
          </p>
        </div>

        <div className="modal-social">
          <button type="button" onClick={() => login("writer@aristotelian.ai")}>
            <span style={{ fontFamily: "var(--serif)", fontStyle: "italic" }}>G</span> Google
          </button>
          <button type="button" onClick={() => login("writer@aristotelian.ai")}>
            <span style={{ fontFamily: "var(--serif)", fontStyle: "italic" }}>∫</span> Apple
          </button>
        </div>

        <div className="modal-sep">or</div>

        <form
          className="modal-form"
          onSubmit={(e) => { e.preventDefault(); if (email.trim()) login(email.trim()); }}
        >
          <div>
            <label className="f-label">Email</label>
            <input
              className="f-input"
              type="email"
              placeholder="you@studio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="f-label">Password</label>
            <input className="f-input" type="password" placeholder="••••••••" defaultValue="demo" />
          </div>
          <button type="submit" className="btn btn-primary btn-block">
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="modal-foot">
          {mode === "signin" ? "New here? " : "Already have an account? "}
          <button
            type="button"
            className="modal-link"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Create account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
