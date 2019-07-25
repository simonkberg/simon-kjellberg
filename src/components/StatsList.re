open Utils;

module StatsListItems = {
  [@bs.module "./StatsListItems.js"] [@react.component]
  external make: (~stats: 'stats) => React.element = "default";
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

[@react.component]
let make = () =>
  <WakaTimeStatsQuery>
    ...{({WakaTimeStatsQuery.result, _}) =>
      switch (result) {
      | ReasonApolloTypes.Loading => <Loader />
      | ReasonApolloTypes.Error(_error) =>
        <p> {"Language statistics are temporarily unavailable :(" |> str} </p>
      | ReasonApolloTypes.Data(response) =>
        if (response##wakaTime##stats |> Array.length == 0) {
          <p>
            <em>
              {"Oops! Looks like the language statistics are currently empty. "
               ++ {js|I'm probably on vacation 🌴 (or something is broken).|js}
               |> str}
            </em>
          </p>;
        } else {
          <UnorderedList>
            <StatsListItems stats=response##wakaTime##stats />
          </UnorderedList>;
        }
      }
    }
  </WakaTimeStatsQuery>;

let default = make;
