open Utils;

[@bs.module "polished"] external _darken: (float, string) => string = "darken";

let darken = (amount, color: Css_AtomicTypes.Color.t) =>
  color_of_string(_darken(amount, Css_AtomicTypes.Color.toString(color)));
