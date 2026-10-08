/** True while the CSS media query matches, e.g. useMediaQuery('(max-width: 767.98px)'). */
import { useEffect, useState } from 'react';

function getMatches(query) {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia(query).matches
    : false;
}

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => getMatches(query));

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const handleChange = (event) => setMatches(event.matches);
    setMatches(mediaQueryList.matches);
    mediaQueryList.addEventListener('change', handleChange);
    return () => mediaQueryList.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}
