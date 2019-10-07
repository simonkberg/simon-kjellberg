open Utils;

module Styles = {
  open Css;

  let user = style([fontWeight(`bold)]);

  let message =
    style([
      display(`inline),
      selector(
        "code",
        [
          padding2(~v=em(0.1), ~h=em(0.2)),
          fontSize(em(0.8)),
          color(Theme.Code.Color.inline),
          backgroundColor(Theme.Code.backgroundColor),
          border(px(1), `solid, Theme.Code.borderColor),
          borderRadius(em(0.2)),
          verticalAlign(`textBottom),
        ],
      ),
      selector(
        "pre",
        [
          padding(em(0.5)),
          margin2(~v=em(0.5), ~h=`zero),
          backgroundColor(Theme.Code.backgroundColor),
          border(px(1), `solid, Theme.Code.borderColor),
          borderRadius(em(0.2)),
          lineHeight(em(1.0)),
          selector(
            "> code",
            [
              color(Theme.Code.Color.block),
              padding(`zero),
              borderWidth(`zero),
            ],
          ),
        ],
      ),
      selector(
        "blockquote",
        [
          margin(`zero),
          paddingLeft(ch(1.0)),
          borderLeft(ch(0.5), `solid, Theme.Quote.borderColor),
        ],
      ),
      selector(
        "a",
        [
          color(Theme.Color.muted),
          textDecoration(`underline),
          hover([textDecoration(`none)]),
        ],
      ),
    ]);

  let editedLabel = style([color(Theme.Color.muted)]);
};

[@react.component]
let make = (~user, ~text, ~edited=false) => {
  <>
    <span
      className=Styles.user
      style={ReactDOMRe.Style.make(~color="#" ++ user##color, ())}>
      {user##name ++ ": " |> str}
    </span>
    <div className=Styles.message dangerouslySetInnerHTML={"__html": text} />
    {edited
       ? <small className=Styles.editedLabel> {" (edited) " |> str} </small>
       : ReasonReact.null}
  </>;
};

let default = make;
