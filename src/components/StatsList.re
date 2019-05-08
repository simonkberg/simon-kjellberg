open Utils;

module StatsListItems = {
  [@bs.module "./StatsListItems"]
  external statsListItems: ReasonReact.reactClass = "default";
  let make = (~stats, children) =>
    ReasonReact.wrapJsForReason(
      ~reactClass=statsListItems,
      ~props={"stats": stats},
      children,
    );
};

module WakaTimeStats = [%graphql
  {|
    query WakaTimeStatsQuery {
      wakaTime {
        stats {
          name
          percent
        }
      }
    }
  |}
];

module WakaTimeStatsQuery = ReasonApollo.CreateQuery(WakaTimeStats);

let component = ReasonReact.statelessComponent("Stats");

let make = _children => {
  ...component,
  render: _self =>
    <WakaTimeStatsQuery>
      ...{({result}) =>
        switch (result) {
        | Loading => <Loader.Jsx2 />
        | Error(_error) =>
          <p> {"Stats are temporarily unavailable :(" |> str} </p>
        | Data(response) =>
          if (response##wakaTime##stats |> Array.length == 0) {
            <p>
              <em>
                {"Oops! Looks like the plugins is broken, or maybe I'm on vacation?"
                 ++ "Nevertheless, the language statistics are currently empty."
                 |> str}
              </em>
            </p>;
          } else {
            <UnorderedList.Jsx2>
              <StatsListItems stats=response##wakaTime##stats />
            </UnorderedList.Jsx2>;
          }
        }
      }
    </WakaTimeStatsQuery>,
};

let default =
  ReasonReact.wrapReasonForJs(~component, jsProps => make(jsProps##children));

module Jsx3 = {
  /**
   * This is a wrapper created to let this component be used from the new React api.
   * Please convert this component to a [@react.component] function and then remove this wrapping code.
   */
  let make =
    ReasonReactCompat.wrapReasonReactForReact(~component, () => make());
  [@bs.obj] external makeProps: unit => unit = "";
};
