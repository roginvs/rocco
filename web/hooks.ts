import * as React from "react";

export function useWindowSize() {
  const getValue = () => ({
    outerWidth: window.outerWidth,
    innerHeight: window.innerHeight,
  });
  const [value, setValue] = React.useState(getValue());

  React.useEffect(() => {
    const onResize = () => setValue(getValue());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  });

  return value;
}
export function useIsMobile() {
  const size = useWindowSize();
  return size.outerWidth < 600;
}
