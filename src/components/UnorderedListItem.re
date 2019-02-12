open Utils;

let styles =
  Css.(
    style([
      position(`relative),
      before([
        contentRule("*"),
        position(`absolute),
        left(ch(-1.5)),
        color(Theme.Color.muted),
      ]),
      selector(
        "& > ." ++ UnorderedList.styles,
        [marginTop(zero), marginBottom(zero)],
      ),
    ])
  );

let component = ReasonReact.statelessComponent("UnorderedListItem");

let make = (~className=?, ~style=?, children) => {
  ...component,
  render: _self =>
    <li className={cn([styles, className |? ""])} ?style> ...children </li>,
};

let default =
  ReasonReact.wrapReasonForJs(~component, jsProps =>
    make(
      ~className=?Js.Nullable.toOption(jsProps##className),
      ~style=?Js.Nullable.toOption(jsProps##style),
      jsProps##children,
    )
  );
