open Utils;

module Styles = {
  open Css;

  let wrapper =
    style([
      fontSize(pct(100.0)),
      lineHeight(`abs(1.5)),
      fontFamilies([`custom("Iosevka"), `monospace]),
      color(Theme.Color.primary),
    ]);

  let content =
    style([
      margin2(~v=`zero, ~h=`auto),
      maxWidth(Theme.Page.maxWidth),
      padding3(~top=`zero, ~h=rem(0.9375), ~bottom=rem(1.875)),
      unsafe(
        "@supports(padding: max(0px)) and (padding: env(safe-area-inset-bottom))",
        style([
          unsafe("paddingLeft", "max(env(safe-area-inset-left), 0.9375rem)"),
          unsafe(
            "paddingRight",
            "max(env(safe-area-inset-right), 0.9375rem)",
          ),
          unsafe(
            "paddingBottom",
            "max(env(safe-area-inset-bottom), 1.875rem)",
          ),
        ]),
      ),
    ]);
};

[@react.component]
let make = (~siteTitle="Simon Kjellberg", ~siteDescription="", ~children) => {
  <div className=Styles.wrapper>
    <Next.Head>
      <title> {siteTitle |> str} </title>
      <meta property="og:title" content=siteTitle />
      <meta
        name="description"
        property="og:description"
        content=siteDescription
      />
    </Next.Head>
    <Header siteTitle />
    <div className=Styles.content> children </div>
  </div>;
};

let default = make;
