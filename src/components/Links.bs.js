// Generated by BUCKLESCRIPT, PLEASE EDIT WITH CARE

import * as React from "react";
import * as Link$SimonKjellberg from "./Link.bs.js";
import * as Utils$SimonKjellberg from "../Utils.bs.js";
import * as Heading$SimonKjellberg from "./Heading.bs.js";
import * as UnorderedList$SimonKjellberg from "./UnorderedList.bs.js";
import * as UnorderedListItem$SimonKjellberg from "./UnorderedListItem.bs.js";

function Links(Props) {
  return React.createElement("section", undefined, React.createElement(Heading$SimonKjellberg.make, {
                  level: /* Level2 */-656133554,
                  children: Utils$SimonKjellberg.str("Links")
                }), React.createElement(UnorderedList$SimonKjellberg.make, {
                  children: null
                }, React.createElement(UnorderedListItem$SimonKjellberg.make, {
                      children: React.createElement(Link$SimonKjellberg.make, {
                            href: "https://github.com/simonkberg",
                            children: Utils$SimonKjellberg.str("GitHub")
                          })
                    }), React.createElement(UnorderedListItem$SimonKjellberg.make, {
                      children: React.createElement(Link$SimonKjellberg.make, {
                            href: "https://linkedin.com/in/simonkjellberg",
                            children: Utils$SimonKjellberg.str("LinkedIn")
                          })
                    })));
}

var make = Links;

var $$default = Links;

export {
  make ,
  $$default ,
  $$default as default,
  
}
/* react Not a pure module */
