open Css;

type colors = {
  black: color,
  white: color,
  silver: color,
  whitesmoke: color,
  firebrick: color,
};

let colors = {
  black: hex("000"),
  white: hex("fff"),
  silver: hex("c0c0c0"),
  whitesmoke: hex("f5f5f5"),
  firebrick: hex("b22222"),
};

module Color = {
  let primary = colors.black;
  let secondary = colors.white;
  let muted = colors.silver;
};

module Background = {
  let primary = colors.black;
  let secondary = colors.white;
  let muted = colors.silver;
};

module Page = {
  let maxWidth = rem(35.0);
};

module Header = {
  let color = colors.white;
  let backgroundColor = colors.black;
};

module Scrollbar = {
  let width = rem(0.2);

  module Thumb = {
    let color = colors.silver;
    let redius = rem(0.1);
  };

  module Track = {
    let color = transparent;
  };
};

module Terminal = {
  module Window = {
    let backgroundColor = hex("0d1f2d");
  };

  module Topbar = {
    let backgroundColor = hex("e0e8f0");
    let height = rem(1.875);
  };

  module Controls = {
    module Close = {
      let backgroundColor = hex("ff6057");
    };
    module Minimize = {
      let backgroundColor = hex("ffbd2e");
    };
    module Maximize = {
      let backgroundColor = hex("27c93f");
    };
  };

  module Content = {
    let color = hex("f4faff");
    let maxHeight = rem(25.0);
  };
};

module Code = {
  module Color = {
    let inline = colors.firebrick;
    let block = colors.black;
  };

  let background = colors.whitesmoke;
  let border = colors.silver;
};

module Quote = {
  let border = colors.whitesmoke;
};
