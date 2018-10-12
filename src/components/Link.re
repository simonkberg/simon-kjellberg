let styles =
  Css.(
    style([
      color(`currentColor),
      textDecoration(`underline),
      hover([textDecoration(`none)]),
    ])
  );

let component = ReasonReact.statelessComponent("Link");

let make = (~href, children) => {
  ...component,
  render: _self => <a href className=styles> ...children </a>,
};

let default =
  ReasonReact.wrapReasonForJs(~component, jsProps =>
    make(~href=jsProps##href, jsProps##children)
  );
