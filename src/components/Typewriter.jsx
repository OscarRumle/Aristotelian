import { useEffect, useRef, useState } from "react";

export function Typewriter({ text, onDone }) {
  const [n, setN] = useState(0);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    setN(0);
  }, [text]);

  useEffect(() => {
    if (n >= text.length) {
      onDoneRef.current?.();
      return;
    }
    const id = setTimeout(() => setN((p) => p + 1), 32);
    return () => clearTimeout(id);
  }, [n, text]);

  return <>{text.slice(0, n)}</>;
}
