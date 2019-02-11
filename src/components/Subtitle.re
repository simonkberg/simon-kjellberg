let styles = Css.(style([color(Theme.Color.muted), fontWeight(`normal)]));

let component = ReasonReact.statelessComponent("Subtitle");

let make = children => {
  ...component,
  render: _self => <small className=styles> ...children </small>,
};

let default =
  ReasonReact.wrapReasonForJs(~component, jsProps => make(jsProps##children));
