[@bs.module "screenfull"] external isEnabled: bool = "isEnabled";
[@bs.module "screenfull"]
external toggle: Dom.element => Js.Promise.t('a) = "toggle";
