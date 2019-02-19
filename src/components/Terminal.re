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

  let windowContentFullscreen = [maxHeight(`none)];

  let windowContent =
    style([
      display(`flex),
      flexDirection(`column),
      position(`relative),
      color(Theme.Terminal.Content.color),
      maxHeight(Theme.Terminal.Content.maxHeight),
      margin2(~v=`zero, ~h=rem(1.25)),
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

type state = {windowRef: ref(option(Dom.element))};

type action =
  | Unused;

let setWindowRef = (windowRef, {ReasonReact.state}) => {
  state.windowRef := Js.Nullable.toOption(windowRef);
};

let handleClickMaximize = (_event, {ReasonReact.state}) =>
  if (Screenfull.enabled) {
    switch (state.windowRef^) {
    | Some(r) => Screenfull.toggle(r) |> ignore
    | None => ()
    };
  } else {
    ();
  };

let component = ReasonReact.reducerComponent("Subtitle");

let make = children => {
  ...component,
  initialState: () => {windowRef: ref(None)},
  reducer: (action, _state) => {
    switch (action) {
    | Unused => ReasonReact.NoUpdate
    };
  },
  render: self =>
    <div className=Styles.window ref={self.handle(setWindowRef)}>
      <div className=Styles.windowTopbar>
        <button className=Styles.windowControlClose />
        <button className=Styles.windowControlMinimize />
        <button
          className=Styles.windowControlMaximize
          onClick={self.handle(handleClickMaximize)}
        />
      </div>
      <div className=Styles.windowContent> ...children </div>
    </div>,
};

let default =
  ReasonReact.wrapReasonForJs(~component, jsProps => make(jsProps##children));
