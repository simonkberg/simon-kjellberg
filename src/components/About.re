let str = ReasonReact.string;
let config = Next.Config.getConfig();
let component = ReasonReact.statelessComponent("About");

let make = _children => {
  ...component,
  render: _self =>
    <section>
      <Heading level=`Level2>
        {"About " |> str}
        <Subtitle> {"(Location: Stockholm, Sweden)" |> str} </Subtitle>
      </Heading>
      <p> {config##publicRuntimeConfig##siteDescription} </p>
      <p>
        {"Working as a consultant via my own company, " |> str}
        <Link href="https://shebang.consulting"> {"Shebang" |> str} </Link>
        {"." |> str}
      </p>
    </section>,
};

let default =
  ReasonReact.wrapReasonForJs(~component, jsProps => make(jsProps##children));
