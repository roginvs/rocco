import * as React from "react";

export function useIsMobile() {
  const isMobile = React.useCallback(() => window.innerWidth < 600, []);

  const [value, setValue] = React.useState(isMobile());

  React.useEffect(() => {
    const onResize = () => setValue(isMobile());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  });

  return value;
}
