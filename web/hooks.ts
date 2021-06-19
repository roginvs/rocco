import * as React from "react";

export function useWindowSize() {
  const getValue = () => ({
    width: window.innerWidth,
    height: window.innerHeight,
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
  return size.width < 600;
}
