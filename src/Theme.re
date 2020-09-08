open Css;
open Css_AtomicTypes;

type colors = {
  black: Color.t,
  white: Color.t,
  silver: Color.t,
  whitesmoke: Color.t,
  firebrick: Color.t,
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
  let primary = colors.white;
  let secondary = colors.black;
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
    let radius = rem(0.1);
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

  let backgroundColor = colors.whitesmoke;
  let borderColor = colors.silver;
};

module Quote = {
  let borderColor = colors.whitesmoke;
};

let theme = {
  "color": {
    "primary": Css_AtomicTypes.Color.toString(Color.primary),
    "secondary": Css_AtomicTypes.Color.toString(Color.secondary),
    "muted": Css_AtomicTypes.Color.toString(Color.muted),
  },
  "background": {
    "primary": Css_AtomicTypes.Color.toString(Background.primary),
    "secondary": Css_AtomicTypes.Color.toString(Background.secondary),
  },
  "page": {
    "maxWidth": Css_AtomicTypes.Length.toString(Page.maxWidth),
  },
  "scrollbar": {
    "width": Css_AtomicTypes.Length.toString(Scrollbar.width),
    "thumb": {
      "color": Css_AtomicTypes.Color.toString(Scrollbar.Thumb.color),
      "radius": Css_AtomicTypes.Length.toString(Scrollbar.Thumb.radius),
    },
    "track": {
      "color": Css_AtomicTypes.Color.toString(Scrollbar.Track.color),
    },
  },
  "terminal": {
    "window": {
      "backgroundColor": Css_AtomicTypes.Color.toString(Terminal.Window.backgroundColor),
    },
    "topbar": {
      "backgroundColor": Css_AtomicTypes.Color.toString(Terminal.Topbar.backgroundColor),
      "height": Css_AtomicTypes.Length.toString(Terminal.Topbar.height),
    },
    "controls": {
      "close": {
        "backgroundColor":
          Css_AtomicTypes.Color.toString(Terminal.Controls.Close.backgroundColor),
      },
      "minimize": {
        "backgroundColor":
          Css_AtomicTypes.Color.toString(Terminal.Controls.Minimize.backgroundColor),
      },
      "maximize": {
        "backgroundColor":
          Css_AtomicTypes.Color.toString(Terminal.Controls.Maximize.backgroundColor),
      },
    },
    "content": {
      "color": Css_AtomicTypes.Color.toString(Terminal.Content.color),
      "maxHeight": Css_AtomicTypes.Length.toString(Terminal.Content.maxHeight),
    },
  },
  "code": {
    "color": {
      "inline": Css_AtomicTypes.Color.toString(Code.Color.inline),
      "block": Css_AtomicTypes.Color.toString(Code.Color.block),
    },
    "background": Css_AtomicTypes.Color.toString(Code.backgroundColor),
    "border": Css_AtomicTypes.Color.toString(Code.borderColor),
  },
  "quote": {
    "border": Css_AtomicTypes.Color.toString(Quote.borderColor),
  },
};

let default = theme;
