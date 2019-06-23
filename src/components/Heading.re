let styles =
  Css.(
    style([
      position(`relative),
      marginTop(em(1.0)),
      marginBottom(em(1.0)),
      marginLeft(ch(1.5)),
      fontSize(rem(1.0)),
      fontWeight(`bold),
      before([
        position(`absolute),
        left(ch(-1.5)),
        contentRule(">"),
        color(Theme.Color.muted),
      ]),
    ])
  );

[@react.component]
let make = (~level, ~children) => {
  switch (level) {
  | `Level1 => <h1 className=styles> children </h1>
  | `Level2 => <h2 className=styles> children </h2>
  | `Level3 => <h3 className=styles> children </h3>
  | `Level4 => <h4 className=styles> children </h4>
  | `Level5 => <h5 className=styles> children </h5>
  | `Level6 => <h6 className=styles> children </h6>
  };
};

let default = make;
let level1 = `Level1;
let level2 = `Level2;
let level3 = `Level3;
let level4 = `Level4;
let level5 = `Level5;
let level6 = `Level6;
