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
      unsafe("padding-top", "max(1.45rem, env(safe-area-inset-top))"),
      unsafe("padding-left", "max(1.0875rem, env(safe-area-inset-left))"),
      unsafe("padding-right", "max(1.0875rem, env(safe-area-inset-right))"),
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

let component = ReasonReact.statelessComponent("Links");

let make = (~siteTitle, _children) => {
  ...component,
  render: _self =>
    <header className=Styles.wrapper>
      <div className=Styles.container>
        <h1 className=Styles.title>
          <Next.Link href="/" passHref=true>
            <a className=Styles.link> {"#!/" ++ siteTitle |> str} </a>
          </Next.Link>
        </h1>
      </div>
    </header>,
};

let default =
  ReasonReact.wrapReasonForJs(~component, jsProps =>
    make(~siteTitle=jsProps##siteTitle, [||])
  );
