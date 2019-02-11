let styles =
  Css.(
    style([
      position(`relative),
      marginTop(em(1.0)),
      marginBottom(em(1.0)),
      marginLeft(ch(1.5)),
      fontSize(rem(1.0)),
      fontWeight(`bold),
      before([
        position(`absolute),
        left(ch(-1.5)),
        contentRule(">"),
        color(Theme.Color.muted),
      ]),
    ])
  );

let component = ReasonReact.statelessComponent("Heading");

let make = (~level, children) => {
  ...component,
  render: _self =>
    ReactDOMRe.createElementVariadic(
      "h"
      ++ (
        switch (level) {
        | `Level1 => "1"
        | `Level2 => "2"
        | `Level3 => "3"
        | `Level4 => "4"
        | `Level5 => "5"
        | `Level6 => "6"
        | _ => "1"
        }
      ),
      ~props=ReactDOMRe.props(~className=styles, ()),
      children,
    ),
};

let default =
  ReasonReact.wrapReasonForJs(~component, jsProps =>
    make(
      ~level=
        switch (jsProps##level) {
        | "1" => `Level1
        | "2" => `Level2
        | "3" => `Level3
        | "4" => `Level4
        | "5" => `Level5
        | "6" => `Level6
        | _ => `Level1
        },
      jsProps##children,
    )
  );
