// Generated by BUCKLESCRIPT VERSION 4.0.18, PLEASE EDIT WITH CARE

import * as Css from "bs-css/src/Css.js";
import * as React from "react";
import * as ReasonReact from "reason-react/src/ReasonReact.js";
import * as Next$SimonKjellberg from "../bindings/Next.bs.js";
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
            Css.unsafe("padding-top", "max(1.45rem, env(safe-area-inset-top))"),
            /* :: */[
              Css.unsafe("padding-left", "max(1.0875rem, env(safe-area-inset-left))"),
              /* :: */[
                Css.unsafe("padding-right", "max(1.0875rem, env(safe-area-inset-right))"),
                /* [] */0
              ]
            ]
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

var component = ReasonReact.statelessComponent("Links");

function make(siteTitle, _children) {
  return /* record */[
          /* debugName */component[/* debugName */0],
          /* reactClassInternal */component[/* reactClassInternal */1],
          /* handedOffState */component[/* handedOffState */2],
          /* willReceiveProps */component[/* willReceiveProps */3],
          /* didMount */component[/* didMount */4],
          /* didUpdate */component[/* didUpdate */5],
          /* willUnmount */component[/* willUnmount */6],
          /* willUpdate */component[/* willUpdate */7],
          /* shouldUpdate */component[/* shouldUpdate */8],
          /* render */(function (_self) {
              return React.createElement("header", {
                          className: wrapper
                        }, React.createElement("div", {
                              className: container
                            }, React.createElement("h1", {
                                  className: title
                                }, ReasonReact.element(undefined, undefined, Next$SimonKjellberg.Link[/* make */0]("/", undefined, undefined, undefined, undefined, true, /* array */[React.createElement("a", {
                                                className: link
                                              }, Utils$SimonKjellberg.str("#!/" + siteTitle))])))));
            }),
          /* initialState */component[/* initialState */10],
          /* retainedProps */component[/* retainedProps */11],
          /* reducer */component[/* reducer */12],
          /* jsElementWrapped */component[/* jsElementWrapped */13]
        ];
}

var $$default = ReasonReact.wrapReasonForJs(component, (function (jsProps) {
        return make(jsProps.siteTitle, /* array */[]);
      }));

export {
  Styles ,
  component ,
  make ,
  $$default ,
  $$default as default,
  
}
/* wrapper Not a pure module */