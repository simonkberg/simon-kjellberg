[@bs.config {jsx: 3}];

open Utils;

[@react.component]
let make = () =>
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
    <StatsList.Jsx3 />
  </section>;

let default = make;
