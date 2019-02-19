open Utils;

[@bs.module "polished"] external _darken: (float, string) => string = "darken";

let darken = (amount, color: Css.color) =>
  color_of_string(_darken(amount, string_of_color(color)));
