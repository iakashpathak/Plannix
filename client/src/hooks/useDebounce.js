import { useEffect, useState } from "react";

// Returns `value` only after it has stopped changing for `delay` ms (used by search boxes to avoid an API call per keystroke).
export default function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
