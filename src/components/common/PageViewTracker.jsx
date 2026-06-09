import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../../utils/analytics";

const PageViewTracker = () => {
  const location = useLocation();

  useEffect(() => {
    if (!import.meta.env.PROD) return;

    const path = `${location.pathname}${location.search}${location.hash}`;
    trackPageView(path);
  }, [location.pathname, location.search, location.hash]);

  return null;
};

export default PageViewTracker;
