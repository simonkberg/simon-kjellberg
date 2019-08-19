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

let string_of_float = Js.Float.toString;

let string_of_int = Js.Int.toString;

let string_of_angle =
  fun
  | `deg(x) => string_of_float(x) ++ "deg"
  | `rad(x) => string_of_float(x) ++ "rad"
  | `grad(x) => string_of_float(x) ++ "grad"
  | `turn(x) => string_of_float(x) ++ "turn";

let string_of_percent =
  fun
  | `percent(x) => string_of_float(x) ++ "%";

let string_of_alpha =
  fun
  | `num(f) => Js.Float.toString(f)
  | `percent(p) => Js.Float.toString(p) ++ "%";

let string_of_rgb = (r, g, b) =>
  "rgb("
  ++ string_of_int(r)
  ++ ", "
  ++ string_of_int(g)
  ++ ", "
  ++ string_of_int(b)
  ++ ")";

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

let string_of_rgba = (r, g, b, a) =>
  "rgba("
  ++ string_of_int(r)
  ++ ", "
  ++ string_of_int(g)
  ++ ", "
  ++ string_of_int(b)
  ++ ", "
  ++ string_of_float(a)
  ++ ")";

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
      float_of_string(re[4]),
    )
  | _ => Js.Exn.raiseError("Invalid formatted value")
  };

let string_of_hsl = (h, s, l) =>
  "hsl("
  ++ string_of_angle(h)
  ++ ", "
  ++ string_of_percent(s)
  ++ ", "
  ++ string_of_percent(l)
  ++ ")";

let hsl_of_string = s =>
  switch (Js.String.match([%re "/^hsl\\((\\d+), ?(\\d+)%, ?(\\d+)%\\)/"], s)) {
  | Some(re) =>
    Css.hsl(
      `deg(float_of_string(re[1])),
      float_of_string(re[2]),
      float_of_string(re[3]),
    )
  | _ => Js.Exn.raiseError("Invalid formatted value")
  };

let string_of_hsla = (h, s, l, a) =>
  "hsla("
  ++ string_of_angle(h)
  ++ ", "
  ++ string_of_percent(s)
  ++ ", "
  ++ string_of_percent(l)
  ++ ", "
  ++ string_of_alpha(a)
  ++ ")";

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
      float_of_string(re[2]),
      float_of_string(re[3]),
      `percent(float_of_string(re[4])),
    )
  | _ => Js.Exn.raiseError("Invalid formatted value")
  };

let string_of_color =
  fun
  | `rgb(r, g, b) => string_of_rgb(r, g, b)
  | `rgba(r, g, b, a) => string_of_rgba(r, g, b, a)
  | `hsl(h, s, l) => string_of_hsl(h, s, l)
  | `hsla(h, s, l, a) => string_of_hsla(h, s, l, a)
  | `hex(s) => "#" ++ s
  | `transparent => "transparent"
  | `currentColor => "currentColor";

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

let rec string_of_length =
  fun
  | `calc(`add, a, b) =>
    "calc(" ++ string_of_length(a) ++ " + " ++ string_of_length(b) ++ ")"
  | `calc(`sub, a, b) =>
    "calc(" ++ string_of_length(a) ++ " - " ++ string_of_length(b) ++ ")"
  | `ch(x) => string_of_float(x) ++ "ch"
  | `cm(x) => string_of_float(x) ++ "cm"
  | `em(x) => string_of_float(x) ++ "em"
  | `ex(x) => string_of_float(x) ++ "ex"
  | `mm(x) => string_of_float(x) ++ "mm"
  | `percent(x) => string_of_float(x) ++ "%"
  | `pt(x) => string_of_int(x) ++ "pt"
  | `px(x) => string_of_int(x) ++ "px"
  | `pxFloat(x) => string_of_float(x) ++ "px"
  | `rem(x) => string_of_float(x) ++ "rem"
  | `vh(x) => string_of_float(x) ++ "vh"
  | `vmax(x) => string_of_float(x) ++ "vmax"
  | `vmin(x) => string_of_float(x) ++ "vmin"
  | `vw(x) => string_of_float(x) ++ "vw"
  | `zero => "0";

let string_of_minmax =
  fun
  | `auto => "auto"
  | `calc(`add, a, b) =>
    "calc(" ++ string_of_length(a) ++ " + " ++ string_of_length(b) ++ ")"
  | `calc(`sub, a, b) =>
    "calc(" ++ string_of_length(a) ++ " - " ++ string_of_length(b) ++ ")"
  | `ch(x) => string_of_float(x) ++ "ch"
  | `cm(x) => string_of_float(x) ++ "cm"
  | `em(x) => string_of_float(x) ++ "em"
  | `ex(x) => string_of_float(x) ++ "ex"
  | `mm(x) => string_of_float(x) ++ "mm"
  | `percent(x) => string_of_float(x) ++ "%"
  | `pt(x) => string_of_int(x) ++ "pt"
  | `px(x) => string_of_int(x) ++ "px"
  | `pxFloat(x) => string_of_float(x) ++ "px"
  | `rem(x) => string_of_float(x) ++ "rem"
  | `vh(x) => string_of_float(x) ++ "vh"
  | `vmax(x) => string_of_float(x) ++ "vmax"
  | `vmin(x) => string_of_float(x) ++ "vmin"
  | `vw(x) => string_of_float(x) ++ "vw"
  | `fr(x) => string_of_float(x) ++ "fr"
  | `zero => "0"
  | `minContent => "min-content"
  | `maxContent => "max-content";

let string_of_dimension =
  fun
  | `auto => "auto"
  | `none => "none"
  | `calc(`add, a, b) =>
    "calc(" ++ string_of_length(a) ++ " + " ++ string_of_length(b) ++ ")"
  | `calc(`sub, a, b) =>
    "calc(" ++ string_of_length(a) ++ " - " ++ string_of_length(b) ++ ")"
  | `ch(x) => string_of_float(x) ++ "ch"
  | `cm(x) => string_of_float(x) ++ "cm"
  | `em(x) => string_of_float(x) ++ "em"
  | `ex(x) => string_of_float(x) ++ "ex"
  | `mm(x) => string_of_float(x) ++ "mm"
  | `percent(x) => string_of_float(x) ++ "%"
  | `pt(x) => string_of_int(x) ++ "pt"
  | `px(x) => string_of_int(x) ++ "px"
  | `pxFloat(x) => string_of_float(x) ++ "px"
  | `rem(x) => string_of_float(x) ++ "rem"
  | `vh(x) => string_of_float(x) ++ "vh"
  | `vmax(x) => string_of_float(x) ++ "vmax"
  | `vmin(x) => string_of_float(x) ++ "vmin"
  | `vw(x) => string_of_float(x) ++ "vw"
  | `fr(x) => string_of_float(x) ++ "fr"
  | `zero => "0"
  | `minContent => "min-content"
  | `maxContent => "max-content"
  | `minmax(a, b) =>
    "minmax(" ++ string_of_minmax(a) ++ "," ++ string_of_minmax(b) ++ ")";
