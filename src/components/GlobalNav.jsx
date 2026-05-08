import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export function GlobalNav({ route, navigate, theme, toggleTheme }) {
  const { user, logout, setLoginOpen } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [route]);

  const is = (r) => route === r || (r === "design" && route.startsWith("design"));
  const go = (r) => { navigate(r); setMobileOpen(false); };

  const initials = user
    ? (user.name || user.email).split(/[\s@.]/).filter(Boolean).slice(0, 2).map(s => s[0].toUpperCase()).join("")
    : "";

  return (
    <>
      <nav className="gnav" role="navigation" aria-label="Primary">
        <div className="gnav-inner">
          <button className="gnav-brand" type="button" onClick={() => go("home")}>
            <span className="gnav-brand-mark" aria-hidden="true" />
            <span>Aristotelian</span>
          </button>

          <div className="gnav-links">
            {!user && <button className={`gnav-link ${is("home") ? "active" : ""}`} onClick={() => go("home")}>Home</button>}
            <button className={`gnav-link ${is("design") ? "active" : ""}`} onClick={() => go("design")}>Worlds</button>
            <button className={`gnav-link ${is("plans") ? "active" : ""}`} onClick={() => go("plans")}>Plans</button>
          </div>

          <div className="gnav-right">
            <button
              className="gnav-theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>

            {!user && (
              <button
                className="gnav-theme-toggle"
                onClick={() => go("settings")}
                aria-label="Open settings"
                title="Settings"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
            )}

            {!user ? (
              <>
                <button className="btn btn-ghost btn-nav" onClick={() => setLoginOpen(true)}>Log in</button>
                <button className="btn btn-primary btn-nav" onClick={() => setLoginOpen(true)}>Get started</button>
              </>
            ) : (
              <div className="gnav-user" ref={menuRef}>
                <button
                  className="gnav-user-btn"
                  onClick={() => setMenuOpen(v => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <span className="gnav-avatar" aria-hidden="true">{initials}</span>
                  <span className="gnav-user-name">{user.name}</span>
                  <span className="gnav-chev" aria-hidden="true">▾</span>
                </button>
                {menuOpen && (
                  <div className="gnav-menu" role="menu">
                    <div className="gnav-menu-head">
                      <div className="gnav-menu-email">{user.email}</div>
                      <div className="gnav-menu-sub">{user.plan || "Quill"} · 20 credits</div>
                    </div>
                    <button className="gnav-menu-item" role="menuitem" onClick={() => { go("design"); setMenuOpen(false); }}>My Worlds</button>
                    <button className="gnav-menu-item" role="menuitem" onClick={() => { go("settings"); setMenuOpen(false); }}>Settings</button>
                    <button className="gnav-menu-item" role="menuitem" onClick={() => { go("plans"); setMenuOpen(false); }}>Billing & Plan</button>
                    <div className="gnav-menu-sep" />
                    <button className="gnav-menu-item" role="menuitem" style={{ color: "var(--dust)" }} onClick={() => { logout(); setMenuOpen(false); }}>Log out</button>
                  </div>
                )}
              </div>
            )}

            <button className="gnav-burger" onClick={() => setMobileOpen(v => !v)} aria-label="Menu" aria-expanded={mobileOpen}>
              <span />
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="gnav-sheet">
          {!user && <button className={`gnav-link ${is("home") ? "active" : ""}`} onClick={() => go("home")}>Home</button>}
          <button className={`gnav-link ${is("design") ? "active" : ""}`} onClick={() => go("design")}>Worlds</button>
          <button className={`gnav-link ${is("plans") ? "active" : ""}`} onClick={() => go("plans")}>Plans</button>
        </div>
      )}
    </>
  );
}
