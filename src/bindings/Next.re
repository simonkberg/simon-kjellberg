module Link = {
  [@bs.module "next/link"] [@react.component]
  external make:
    (
      ~href: 'href=?,
      ~_as: 'as_=?,
      ~prefetch: bool=?,
      ~replace: bool=?,
      ~shallow: bool=?,
      ~passHref: bool=?,
      ~children: 'children=?
    ) =>
    React.element =
    "default";
};

module Head = {
  [@bs.module "next/head"] [@react.component]
  external make: (~children: 'children=?) => React.element = "default";
};

module Error = {
  [@bs.module "next/error"] [@react.component]
  external make: (~statusCode: int, ~children: 'children=?) => React.element =
    "default";
};

module Config = {
  [@bs.module "next/config"] external getConfig: unit => Js.t('a) = "default";
  let getConfig = getConfig;
};
