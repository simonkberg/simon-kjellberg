let styles =
  Css.(
    style([
      color(`currentColor),
      textDecoration(`underline),
      hover([textDecoration(`none)]),
    ])
  );

let component = ReasonReact.statelessComponent("Link");

let make = (~href, ~target=?, ~rel=?, children) => {
  ...component,
  render: _self => <a href ?target ?rel className=styles> ...children </a>,
};

let default =
  ReasonReact.wrapReasonForJs(~component, jsProps =>
    make(
      ~href=jsProps##href,
      ~target=?Js.Nullable.toOption(jsProps##target),
      ~rel=?Js.Nullable.toOption(jsProps##rel),
      jsProps##children,
    )
  );
