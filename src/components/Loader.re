module Styles = {
  open Css;

  let bounce =
    keyframes([
      (0, [transform(scale(0.0, 0.0))]),
      (40, [transform(scale(1.0, 1.0))]),
      (80, [transform(scale(0.0, 0.0))]),
      (100, [transform(scale(0.0, 0.0))]),
    ]);

  let container =
    style([
      position(`relative),
      display(`block),
      marginBottom(rem(1.0)),
      textAlign(`left),
    ]);

  let point =
    style([
      display(`inlineBlock),
      width(ch(1.0)),
      height(ch(1.0)),
      marginRight(ch(0.75)),
      borderRadius(pct(100.0)),
      backgroundColor(`currentColor),
      unsafe("willChange", "transform"),
      animation(
        ~duration=1400,
        ~iterationCount=`infinite,
        ~timingFunction=`easeInOut,
        ~fillMode=`both,
        bounce,
      ),
    ]);

  let point1 = merge([point, style([animationDelay(-320)])]);
  let point2 = merge([point, style([animationDelay(-160)])]);
  let point3 = merge([point, style([animationDelay(0)])]);
};

[@react.component]
let make = () => {
  <div className=Styles.container>
    <span className=Styles.point1 />
    <span className=Styles.point2 />
    <span className=Styles.point3 />
  </div>;
};

let default = make;
