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

[@react.component]
let make = (~className="", ~innerRef=?, ~children) => {
  <ul className={cn([styles, className])} ref=?innerRef> children </ul>;
};

let default = make;

module Jsx2 = {
  let component = ReasonReact.statelessComponent(__MODULE__);
  let make = (~className=?, ~innerRef=?, children) => {
    let children = React.array(children);
    ReasonReactCompat.wrapReactForReasonReact(
      make,
      makeProps(~className?, ~innerRef?, ~children, ()),
      children,
    );
  };
};
