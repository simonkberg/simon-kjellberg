open Utils;

module Styles = {
  open Css;

  let wrapper =
    style([
      fontSize(pct(100.0)),
      lineHeight(`abs(1.5)),
      fontFamily("Iosevka, monospace"),
      color(Theme.Color.primary),
    ]);

  let content =
    style([
      margin2(~v=`zero, ~h=`auto),
      maxWidth(Theme.Page.maxWidth),
      padding3(~top=`zero, ~h=rem(0.9375), ~bottom=rem(1.875)),
      unsafe("padding-left", "max(0.9375rem, env(safe-area-inset-left))"),
      unsafe("padding-right", "max(0.9375rem, env(safe-area-inset-left))"),
      unsafe("padding-bottom", "max(1.875rem, env(safe-area-inset-bottom))"),
    ]);
};
let component = ReasonReact.statelessComponent("Link");

let make = (~siteTitle="Simon Kjellberg", ~siteDescription="", children) => {
  ...component,
  render: _self =>
    <div className=Styles.wrapper>
      <Next.Head>
        <title> {siteTitle |> str} </title>
        <meta property="og:title" content=siteDescription />
        <meta
          name="description"
          property="og:description"
          content=siteDescription
        />
      </Next.Head>
      <Header siteTitle />
      <div className=Styles.content> ...children </div>
    </div>,
};

let default =
  ReasonReact.wrapReasonForJs(~component, jsProps =>
    make(
      ~siteTitle=jsProps##siteTitle,
      ~siteDescription=jsProps##siteDescription,
      jsProps##children,
    )
  );
