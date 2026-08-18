import { useLayoutEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
import { ScrollContext } from "@/hooks/use-scroll-progress";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const containerRef = useContext(ScrollContext);

  useLayoutEffect(() => {
    if (containerRef?.current) {
      containerRef.current.scrollTo(0, 0);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, containerRef]);

  return null;
};

export default ScrollToTop;