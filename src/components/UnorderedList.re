open Utils;

let styles =
  Css.(
    style([
      listStyleType(`none),
      padding(zero),
      marginTop(em(1.0)),
      marginBottom(em(1.0)),
      marginLeft(ch(1.5)),
    ])
  );

let component = ReasonReact.statelessComponent("UnorderedList");

let make = (~className=?, ~innerRef=?, children) => {
  ...component,
  render: _self =>
    <ul className={cn([styles, className |? ""])} ref=?innerRef>
      ...children
    </ul>,
};

let default =
  ReasonReact.wrapReasonForJs(~component, jsProps =>
    make(
      ~className=?Js.Nullable.toOption(jsProps##className),
      ~innerRef=?Js.Nullable.toOption(jsProps##innerRef),
      jsProps##children,
    )
  );
