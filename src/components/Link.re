let styles =
  Css.(
    style([
      color(`currentColor),
      textDecoration(`underline),
      hover([textDecoration(`none)]),
    ])
  );

[@react.component]
let make = (~href, ~target=?, ~rel=?, ~children) => {
  <a href ?target ?rel className=styles> children </a>;
};
