let str = ReasonReact.string;

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
  ++ string_of_int(h)
  ++ ", "
  ++ string_of_int(s)
  ++ "%, "
  ++ string_of_int(l)
  ++ "%"
  ++ ")";

let hsl_of_string = s =>
  switch (Js.String.match([%re "/^hsl\\((\\d+), ?(\\d+)%, ?(\\d+)%\\)/"], s)) {
  | Some(re) =>
    Css.hsl(
      int_of_string(re[1]),
      int_of_string(re[2]),
      int_of_string(re[3]),
    )
  | _ => Js.Exn.raiseError("Invalid formatted value")
  };

let string_of_hsla = (h, s, l, a) =>
  "hsla("
  ++ string_of_int(h)
  ++ ", "
  ++ string_of_int(s)
  ++ "%, "
  ++ string_of_int(l)
  ++ "%, "
  ++ string_of_float(a)
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
      int_of_string(re[1]),
      int_of_string(re[2]),
      int_of_string(re[3]),
      float_of_string(re[4]),
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
