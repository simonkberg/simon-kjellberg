open Utils;

let styles =
  Css.(
    style([
      position(relative),
      before([
        contentRule(`text("*")),
        position(absolute),
        left(ch(-1.5)),
        color(Theme.Color.muted),
      ]),
      selector(
        "& > ." ++ UnorderedList.styles,
        [marginTop(zero), marginBottom(zero)],
      ),
    ])
  );

[@react.component]
let make =
  forwardDOMRef((~className=?, ~style=?, ~children, ref) =>
    <li className={cn([styles, className |? ""])} ?style ?ref>
      children
    </li>
  );

let default = make;
