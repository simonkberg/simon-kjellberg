// Generated by BUCKLESCRIPT VERSION 5.0.3, PLEASE EDIT WITH CARE

import * as Css from "bs-css/src/Css.js";
import * as React from "react";
import * as Link from "next/link";
import * as Theme$SimonKjellberg from "../Theme.bs.js";
import * as Utils$SimonKjellberg from "../Utils.bs.js";

var wrapper = Css.style(/* :: */[
      Css.color(Theme$SimonKjellberg.Header[/* color */0]),
      /* :: */[
        Css.backgroundColor(Theme$SimonKjellberg.Header[/* backgroundColor */1]),
        /* :: */[
          Css.marginBottom(Css.rem(1.45)),
          /* [] */0
        ]
      ]
    ]);

var container = Css.style(/* :: */[
      Css.margin2(/* zero */-789508312, /* auto */-1065951377),
      /* :: */[
        Css.maxWidth(Css.rem(35.0)),
        /* :: */[
          Css.padding2(Css.rem(1.45), Css.rem(1.0875)),
          /* :: */[
            Css.unsafe("@supports(padding: max(0px)) and (padding: env(safe-area-inset-top))", Css.style(/* :: */[
                      Css.unsafe("padding-top", "max(env(safe-area-inset-top), 1.45rem)"),
                      /* :: */[
                        Css.unsafe("padding-left", "max(env(safe-area-inset-left), 1.0875rem)"),
                        /* :: */[
                          Css.unsafe("padding-right", "max(env(safe-area-inset-right), 1.0875rem)"),
                          /* [] */0
                        ]
                      ]
                    ])),
            /* [] */0
          ]
        ]
      ]
    ]);

var title = Css.style(/* :: */[
      Css.fontSize(Css.rem(1.0)),
      /* :: */[
        Css.fontWeight(/* bold */-1055161979),
        /* :: */[
          Css.margin(/* zero */-789508312),
          /* :: */[
            Css.textTransform(/* lowercase */-425349839),
            /* [] */0
          ]
        ]
      ]
    ]);

var link = Css.style(/* :: */[
      Css.color(Theme$SimonKjellberg.Header[/* color */0]),
      /* :: */[
        Css.textDecoration(/* none */-922086728),
        /* [] */0
      ]
    ]);

var Styles = /* module */[
  /* wrapper */wrapper,
  /* container */container,
  /* title */title,
  /* link */link
];

function Header(Props) {
  var siteTitle = Props.siteTitle;
  return React.createElement("header", {
              className: wrapper
            }, React.createElement("div", {
                  className: container
                }, React.createElement("h1", {
                      className: title
                    }, React.createElement(Link.default, {
                          href: "/",
                          passHref: true,
                          children: React.createElement("a", {
                                className: link
                              }, Utils$SimonKjellberg.str("#!/" + siteTitle))
                        }))));
}

var make = Header;

var $$default = Header;

export {
  Styles ,
  make ,
  $$default ,
  $$default as default,
  
}
/* wrapper Not a pure module */
