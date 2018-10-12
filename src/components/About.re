let str = ReasonReact.string;
let config = Next.Config.getConfig();
let component = ReasonReact.statelessComponent("About");

let make = _children => {
  ...component,
  render: _self =>
    <section>
      <Heading level=`Level2>
        {str("About ")}
        <Subtitle> {str("(Location: Stockholm, Sweden)")} </Subtitle>
      </Heading>
      <p> {config##publicRuntimeConfig##siteDescription} </p>
      <p>
        {str("Working as a consultant via my own company, ")}
        <Link href="https://shebang.consulting"> {str("Shebang")} </Link>
        {str(".")}
      </p>
    </section>,
};

let default =
  ReasonReact.wrapReasonForJs(~component, jsProps => make(jsProps##children));
