let str = React.string;

let dangerousHtml: string => Js.t('a) = html => {"__html": html};

let forwardDOMRef:
  (('props, option(ReactDOMRe.domRef)) => React.element) =>
  React.component('props) =
  fn =>
    React.forwardRef((props, ref_) =>
      fn(
        props,
        ref_->Js.Nullable.toOption->Belt.Option.map(ReactDOMRe.Ref.domRef),
      )
    );

let (>>=) = (value, fn) =>
  switch (value) {
  | Some(value) => fn(value)
  | None => None
  };

let (|?) = (value, default) =>
  switch (value) {
  | None => default
  | Some(value) => value
  };

let cn = cns => cns->Belt.List.keep(x => x !== "")->String.concat(" ", _);

let rgb_of_string = s =>
  switch (Js.String.match([%re "/^rgb\\((\\d+), ?(\\d+), ?(\\d+)\\)/"], s)) {
  | Some(re) =>
    Css.rgb(
      int_of_string(re[1]),
      int_of_string(re[2]),
      int_of_string(re[3]),
    )
  | _ => Js.Exn.raiseError("Invalid formatted value")
  };

let rgba_of_string = s =>
  switch (
    Js.String.match(
      [%re "/^rgba\\((\\d+), ?(\\d+), ?(\\d+), ?([\\d.]+)\\)/"],
      s,
    )
  ) {
  | Some(re) =>
    Css.rgba(
      int_of_string(re[1]),
      int_of_string(re[2]),
      int_of_string(re[3]),
      `num(float_of_string(re[4])),
    )
  | _ => Js.Exn.raiseError("Invalid formatted value")
  };

let hsl_of_string = s =>
  switch (Js.String.match([%re "/^hsl\\((\\d+), ?(\\d+)%, ?(\\d+)%\\)/"], s)) {
  | Some(re) =>
    Css.hsl(
      `deg(float_of_string(re[1])),
      `percent(float_of_string(re[2])),
      `percent(float_of_string(re[3])),
    )
  | _ => Js.Exn.raiseError("Invalid formatted value")
  };

let hsla_of_string = s =>
  switch (
    Js.String.match(
      [%re "/^hsl\\((\\d+), ?(\\d+)%, ?(\\d+)%, ?([\\d.]+)\\)/"],
      s,
    )
  ) {
  | Some(re) =>
    Css.hsla(
      `deg(float_of_string(re[1])),
      `percent(float_of_string(re[2])),
      `percent(float_of_string(re[3])),
      `percent(float_of_string(re[4])),
    )
  | _ => Js.Exn.raiseError("Invalid formatted value")
  };

let color_of_string = s =>
  if (Js.String.startsWith("rgb(", s)) {
    rgb_of_string(s);
  } else if (Js.String.startsWith("rgba(", s)) {
    rgba_of_string(s);
  } else if (Js.String.startsWith("rgba(", s)) {
    rgba_of_string(s);
  } else if (Js.String.startsWith("#", s)) {
    Css.hex(Js.String.sliceToEnd(~from=1, s));
  } else if (s == "transparent") {
    Css.transparent;
  } else if (s == "currentColor") {
    Css.currentColor;
  } else {
    Js.Exn.raiseError("Invalid value");
  };
