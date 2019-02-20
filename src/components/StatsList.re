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
        | Loading => <Loader />
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
            <UnorderedList>
              <StatsListItems stats={response##wakaTime##stats} />
            </UnorderedList>;
          }
        }
      }
    </WakaTimeStatsQuery>,
};

let default =
  ReasonReact.wrapReasonForJs(~component, jsProps => make(jsProps##children));
