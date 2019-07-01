open Utils;

module Styles = {
  open Css;

  let wrapper =
    style([
      color(Theme.Header.color),
      backgroundColor(Theme.Header.backgroundColor),
      marginBottom(rem(1.45)),
    ]);

  let container =
    style([
      margin2(~v=`zero, ~h=`auto),
      maxWidth(rem(35.0)),
      padding2(~v=rem(1.45), ~h=rem(1.0875)),
      unsafe(
        "@supports(padding: max(0px)) and (padding: env(safe-area-inset-top))",
        style([
          unsafe("paddingTop", "max(env(safe-area-inset-top), 1.45rem)"),
          unsafe("paddingLeft", "max(env(safe-area-inset-left), 1.0875rem)"),
          unsafe(
            "paddingRight",
            "max(env(safe-area-inset-right), 1.0875rem)",
          ),
        ]),
      ),
    ]);

  let title =
    style([
      fontSize(rem(1.0)),
      fontWeight(`bold),
      margin(`zero),
      textTransform(`lowercase),
    ]);

  let link = style([color(Theme.Header.color), textDecoration(`none)]);
};

[@react.component]
let make = (~siteTitle) => {
  <header className=Styles.wrapper>
    <div className=Styles.container>
      <h1 className=Styles.title>
        <Next.Link href="/" passHref=true>
          <a className=Styles.link> {"#!/" ++ siteTitle |> str} </a>
        </Next.Link>
      </h1>
    </div>
  </header>;
};

let default = make;
