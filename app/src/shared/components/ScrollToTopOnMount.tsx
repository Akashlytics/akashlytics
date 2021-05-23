import React, { useEffect } from "react";

export const ScrollToTopOnMount: React.FunctionComponent = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return null;
};
