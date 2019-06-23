let styles = Css.(style([color(Theme.Color.muted), fontWeight(`normal)]));

[@react.component]
let make = (~children) => {
  <small className=styles> children </small>;
};
