open Utils;

let component = ReasonReact.statelessComponent("Stats");

let make = _children => {
  ...component,
  render: _self =>
    <section>
      <Heading level=`Level2>
        {"Currently writing " |> str}
        <Subtitle>
          {"(Via " |> str}
          <Link
            href="https://wakatime.com/@simonkberg"
            target="_blank"
            rel="noopener noreferrer">
            {"WakaTime" |> str}
          </Link>
          {")" |> str}
        </Subtitle>
      </Heading>
      <StatsList />
    </section>,
};

let default =
  ReasonReact.wrapReasonForJs(~component, jsProps => make(jsProps##children));
