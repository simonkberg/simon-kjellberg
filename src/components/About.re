[@bs.config {jsx: 3}];

let str = React.string;
let config = Next.Config.getConfig();

[@react.component]
let make = () => {
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
  </section>;
};

let default = make;
