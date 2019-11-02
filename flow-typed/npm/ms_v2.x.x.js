// flow-typed signature: 4633dcce5cdb3222c541e8982b89cd18
// flow-typed version: c6154227d1/ms_v2.x.x/flow_>=v0.104.x

declare module 'ms' {
  declare type Options = { long?: boolean, ... };
  
  declare module.exports: {
    (val: string, options?: Options): number,
    (val: number, options?: Options): string,
    ...
  };
}
