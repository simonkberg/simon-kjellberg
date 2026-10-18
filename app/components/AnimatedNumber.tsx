"use client";

import { animated, useSpring } from "@react-spring/web";
import { useState, useSyncExternalStore } from "react";

const reducedMotion = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const query = matchMedia(reducedMotion);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export interface AnimatedNumberProps {
  value: number;
  decimals?: number;
}

export const AnimatedNumber = ({
  value,
  decimals = 0,
}: AnimatedNumberProps) => {
  // False while hydrating too: the server markup already shows the value.
  const animate = useSyncExternalStore(
    subscribe,
    () => !matchMedia(reducedMotion).matches,
    () => false,
  );
  const [from] = useState(animate ? 0 : value);
  const spring = useSpring({
    from: { value: from },
    to: { value },
    immediate: !animate,
  });

  return (
    <animated.span>
      {spring.value.to((val) => val.toFixed(decimals))}
    </animated.span>
  );
};
