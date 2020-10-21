// Generated by ReScript, PLEASE EDIT WITH CARE

import * as Css from "bs-css-emotion/src/Css.bs.js";
import * as Curry from "bs-platform/lib/es6/curry.js";
import * as React from "react";
import * as Caml_option from "bs-platform/lib/es6/caml_option.js";

var styles = Curry._1(Css.style, {
      hd: Css.color(Css.currentColor),
      tl: {
        hd: Css.textDecoration(Css.underline),
        tl: {
          hd: Css.hover({
                hd: Css.textDecoration(Css.none),
                tl: /* [] */0
              }),
          tl: /* [] */0
        }
      }
    });

function Link(Props) {
  var href = Props.href;
  var target = Props.target;
  var rel = Props.rel;
  var children = Props.children;
  var tmp = {
    className: styles,
    href: href
  };
  if (rel !== undefined) {
    tmp.rel = Caml_option.valFromOption(rel);
  }
  if (target !== undefined) {
    tmp.target = Caml_option.valFromOption(target);
  }
  return React.createElement("a", tmp, children);
}

var make = Link;

export {
  styles ,
  make ,
  
}
/* styles Not a pure module */
