"use client";

import { animated, useSpring } from "@react-spring/web";
import { useState } from "react";

import { useMotion } from "./useMotion";

export interface AnimatedNumberProps {
  value: number;
  decimals?: number;
}

export const AnimatedNumber = ({
  value,
  decimals = 0,
}: AnimatedNumberProps) => {
  const animate = useMotion();
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
