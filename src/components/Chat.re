open Utils;

module ChatHistory = {
  [@bs.module "./ChatHistory.js"] [@react.component]
  external make: _ => React.element = "default";
};

module ChatMessageInput = {
  [@bs.module "./ChatMessageInput.js"] [@react.component]
  external make: _ => React.element = "default";
};

let styles =
  Css.(
    style([
      display(`flex),
      flexDirection(`column),
      unsafe("max-height", "inherit"),
    ])
  );

[@react.component]
let make = () => {
  <section>
    <Heading level=`Level2> {"Slack" |> str} </Heading>
    <Terminal>
      <div className=styles> <ChatHistory /> <ChatMessageInput /> </div>
    </Terminal>
  </section>;
};

let default = make;
