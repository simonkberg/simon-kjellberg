// Generated by BUCKLESCRIPT VERSION 4.0.18, PLEASE EDIT WITH CARE

import * as Polished from "polished";
import * as Utils$SimonKjellberg from "../Utils.bs.js";

function darken(amount, color) {
  return Utils$SimonKjellberg.color_of_string(Polished.darken(amount, Utils$SimonKjellberg.string_of_color(color)));
}

export {
  darken ,
  
}
/* polished Not a pure module */