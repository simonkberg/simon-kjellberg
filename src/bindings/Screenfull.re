[@bs.module "screenfull"] external enabled: bool = "enabled";
[@bs.module "screenfull"]
external toggle: Dom.element => Js.Promise.t('a) = "toggle";
