let str = ReasonReact.string;

let (>>=) = (value, fn) =>
  switch (value) {
  | Some(value) => fn(value)
  | None => None
  };

let (|?) = (value, default) =>
  switch (value) {
  | None => default
  | Some(value) => value
  };

let cn = cns => cns->Belt.List.keep(x => x !== "")->String.concat(" ", _);
