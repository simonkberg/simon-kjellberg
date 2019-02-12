open Utils;

let component = ReasonReact.statelessComponent("Links");

let make = _children => {
  ...component,
  render: _self =>
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
    </section>,
};

let default = ReasonReact.wrapReasonForJs(~component, _jsProps => make([||]));
