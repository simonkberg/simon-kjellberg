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
      {"Working as a web engineer at " |> str}
      <Link
        href="https://twitter.com/SpotifyEng"
        target="_blank"
        rel="noopener noreferrer">
        {"Spotify" |> str}
      </Link>
      {"." |> str}
    </p>
  </section>;
};

let default = make;
