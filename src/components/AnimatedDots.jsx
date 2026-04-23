import { useEffect, useState } from "react";

export function AnimatedDots() {
  const [dots, setDots] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d >= 3 ? 1 : d + 1)), 420);
    return () => clearInterval(id);
  }, []);
  return <span style={{ letterSpacing: ".05em" }}>{".".repeat(dots)}</span>;
}
