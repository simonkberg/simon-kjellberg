// Generated by BUCKLESCRIPT, PLEASE EDIT WITH CARE

import * as React from "react";
import * as Js_exn from "bs-platform/lib/es6/js_exn.js";
import * as Js_dict from "bs-platform/lib/es6/js_dict.js";
import * as Js_json from "bs-platform/lib/es6/js_json.js";
import * as Js_option from "bs-platform/lib/es6/js_option.js";
import * as Caml_option from "bs-platform/lib/es6/caml_option.js";
import * as ReasonApollo from "@simonkberg/reason-apollo/src/ReasonApollo.bs.js";
import * as StatsListItemsJs from "./StatsListItems.js";
import * as Utils$SimonKjellberg from "../Utils.bs.js";
import * as Loader$SimonKjellberg from "./Loader.bs.js";
import * as UnorderedList$SimonKjellberg from "./UnorderedList.bs.js";

var make = StatsListItemsJs.default;

var StatsListItems = {
  make: make
};

var ppx_printed_query = "query WakaTimeStatsQuery  {\n__typename\nwakaTime  {\n__typename\nstats  {\n__typename\nname  \npercent  \n}\n\n}\n\n}\n";

function parse(value) {
  var value$1 = Js_option.getExn(Js_json.decodeObject(value));
  var value$2 = Js_dict.get(value$1, "wakaTime");
  var tmp;
  if (value$2 !== undefined) {
    var value$3 = Js_option.getExn(Js_json.decodeObject(Caml_option.valFromOption(value$2)));
    var value$4 = Js_dict.get(value$3, "stats");
    tmp = {
      stats: value$4 !== undefined ? Js_option.getExn(Js_json.decodeArray(Caml_option.valFromOption(value$4))).map(function (value) {
              var value$1 = Js_option.getExn(Js_json.decodeObject(value));
              var value$2 = Js_dict.get(value$1, "name");
              var tmp;
              if (value$2 !== undefined) {
                var value$3 = Caml_option.valFromOption(value$2);
                var value$4 = Js_json.decodeString(value$3);
                tmp = value$4 !== undefined ? value$4 : Js_exn.raiseError("graphql_ppx: Expected string, got " + JSON.stringify(value$3));
              } else {
                tmp = Js_exn.raiseError("graphql_ppx: Field name on type WakaTimeStats is missing");
              }
              var value$5 = Js_dict.get(value$1, "percent");
              var tmp$1;
              if (value$5 !== undefined) {
                var value$6 = Caml_option.valFromOption(value$5);
                var value$7 = Js_json.decodeNumber(value$6);
                tmp$1 = value$7 !== undefined ? value$7 : Js_exn.raiseError("graphql_ppx: Expected float, got " + JSON.stringify(value$6));
              } else {
                tmp$1 = Js_exn.raiseError("graphql_ppx: Field percent on type WakaTimeStats is missing");
              }
              return {
                      name: tmp,
                      percent: tmp$1
                    };
            }) : Js_exn.raiseError("graphql_ppx: Field stats on type WakaTime is missing")
    };
  } else {
    tmp = Js_exn.raiseError("graphql_ppx: Field wakaTime on type Query is missing");
  }
  return {
          wakaTime: tmp
        };
}

function make$1(param) {
  return {
          query: ppx_printed_query,
          variables: null,
          parse: parse
        };
}

function makeWithVariables(param) {
  return {
          query: ppx_printed_query,
          variables: null,
          parse: parse
        };
}

function makeVariables(param) {
  return null;
}

function definition_2(graphql_ppx_use_json_variables_fn) {
  return 0;
}

var definition = [
  parse,
  ppx_printed_query,
  definition_2
];

function ret_type(f) {
  return {};
}

var MT_Ret = {};

var WakaTimeStats = {
  ppx_printed_query: ppx_printed_query,
  query: ppx_printed_query,
  parse: parse,
  make: make$1,
  makeWithVariables: makeWithVariables,
  makeVariables: makeVariables,
  definition: definition,
  ret_type: ret_type,
  MT_Ret: MT_Ret
};

var WakaTimeStatsQuery = ReasonApollo.CreateQuery({
      query: ppx_printed_query,
      parse: parse
    });

function StatsList(Props) {
  return React.createElement(WakaTimeStatsQuery.make, {
              children: (function (param) {
                  var result = param.result;
                  if (typeof result === "number") {
                    return React.createElement(Loader$SimonKjellberg.make, {});
                  }
                  if (!result.TAG) {
                    return React.createElement("p", undefined, Utils$SimonKjellberg.str("Language statistics are temporarily unavailable :("));
                  }
                  var response = result._0;
                  if (response.wakaTime.stats.length === 0) {
                    return React.createElement("p", undefined, React.createElement("em", undefined, Utils$SimonKjellberg.str("Oops! Looks like the language statistics are currently empty. " + "I\'m probably on vacation 🌴 (or something is broken).")));
                  } else {
                    return React.createElement(UnorderedList$SimonKjellberg.make, {
                                children: React.createElement(make, {
                                      stats: response.wakaTime.stats
                                    })
                              });
                  }
                })
            });
}

var make$2 = StatsList;

var $$default = StatsList;

export {
  StatsListItems ,
  WakaTimeStats ,
  WakaTimeStatsQuery ,
  make$2 as make,
  $$default ,
  $$default as default,
  
}
/* make Not a pure module */
