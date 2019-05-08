[@bs.config {jsx: 3}];

open Utils;

[@react.component]
let make = () => {
  <section>
    <Heading level=`Level2> {"Links" |> str} </Heading>
    <UnorderedList>
      <UnorderedListItem>
        <Link href="https://github.com/simonkberg"> {"GitHub" |> str} </Link>
      </UnorderedListItem>
      <UnorderedListItem>
        <Link href="https://linkedin.com/in/simonkjellberg">
          {"LinkedIn" |> str}
        </Link>
      </UnorderedListItem>
    </UnorderedList>
  </section>;
};

let default = make;
