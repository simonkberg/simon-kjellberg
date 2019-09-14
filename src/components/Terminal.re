module Styles = {
  open Css;

  let windowFullscreen = [height(pct(100.0)), margin(`zero)];

  let window =
    style([
      position(`relative),
      display(`flex),
      flexDirection(`column),
      margin2(~v=em(1.0), ~h=`auto),
      width(pct(100.0)),
      borderRadius(rem(0.625)),
      backgroundColor(Theme.Terminal.Window.backgroundColor),
      selector("&:fullscreen", windowFullscreen),
      selector("&:-ms-fullscreen", windowFullscreen),
      selector("&:-moz-full-screen", windowFullscreen),
      selector("&:-webkit-full-screen", windowFullscreen),
    ]);

  let windowTopbar =
    style([
      backgroundColor(Theme.Terminal.Topbar.backgroundColor),
      height(Theme.Terminal.Topbar.height),
      borderTopLeftRadius(rem(0.5)),
      borderTopRightRadius(rem(0.5)),
      padding2(~v=`zero, ~h=rem(0.625)),
    ]);

  let windowControl =
    style([
      display(`inlineBlock),
      width(rem(0.75)),
      height(rem(0.75)),
      padding(`zero),
      marginTop(rem(0.625)),
      marginRight(rem(0.25)),
      borderRadius(rem(0.5)),
      border(px(1), `solid, `transparent),
      focus([outlineStyle(`none)]),
    ]);

  let windowControlClose =
    merge([
      windowControl,
      style([
        backgroundColor(Theme.Terminal.Controls.Close.backgroundColor),
        focus([
          borderColor(
            Polished.darken(
              0.15,
              Theme.Terminal.Controls.Close.backgroundColor,
            ),
          ),
        ]),
      ]),
    ]);

  let windowControlMinimize =
    merge([
      windowControl,
      style([
        backgroundColor(Theme.Terminal.Controls.Minimize.backgroundColor),
        focus([
          borderColor(
            Polished.darken(
              0.15,
              Theme.Terminal.Controls.Minimize.backgroundColor,
            ),
          ),
        ]),
      ]),
    ]);
  let windowControlMaximize =
    merge([
      windowControl,
      style([
        backgroundColor(Theme.Terminal.Controls.Maximize.backgroundColor),
        focus([
          borderColor(
            Polished.darken(
              0.15,
              Theme.Terminal.Controls.Maximize.backgroundColor,
            ),
          ),
        ]),
      ]),
    ]);

  let windowContentFullscreen = [
    maxHeight(Calc.(-)(vh(100.), Theme.Terminal.Topbar.height)),
  ];

  let windowContent =
    style([
      display(`flex),
      flexDirection(`column),
      position(`relative),
      color(Theme.Terminal.Content.color),
      maxHeight(Theme.Terminal.Content.maxHeight),
      margin2(~v=`zero, ~h=rem(0.625)),
      selector("." ++ window ++ ":fullscreen &", windowContentFullscreen),
      selector("." ++ window ++ ":-ms-fullscreen &", windowContentFullscreen),
      selector(
        "." ++ window ++ ":-moz-full-screen &",
        windowContentFullscreen,
      ),
      selector(
        "." ++ window ++ ":-webkit-full-screen &",
        windowContentFullscreen,
      ),
    ]);
};

[@react.component]
let make = (~children) => {
  let windowRef = React.useRef(Js.Nullable.null);
  let handleClickMaximize =
    React.useCallback1(
      _ =>
        if (Screenfull.isEnabled) {
          switch (windowRef->React.Ref.current->Js.Nullable.toOption) {
          | Some(r) => Screenfull.toggle(r) |> ignore
          | None => ()
          };
        },
      [|windowRef|],
    );

  <div className=Styles.window ref={ReactDOMRe.Ref.domRef(windowRef)}>
    <div className=Styles.windowTopbar>
      <button className=Styles.windowControlClose />
      <button className=Styles.windowControlMinimize />
      <button
        className=Styles.windowControlMaximize
        onClick=handleClickMaximize
      />
    </div>
    <div className=Styles.windowContent> children </div>
  </div>;
};

let default = make;
