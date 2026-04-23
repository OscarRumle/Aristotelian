import { useState, useEffect, useCallback } from "react";

export function useRoute() {
  const [route, setRoute] = useState(() =>
    window.location.hash.replace(/^#\/?/, "") || "home"
  );

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash.replace(/^#\/?/, "") || "home");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = useCallback((r) => { window.location.hash = "/" + r; }, []);
  return [route, navigate];
}
