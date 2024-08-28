import type { Verbosity } from "../types.js"

export class Log {
  verbosity: Verbosity
  prefix: string;

  constructor(prefix: string, verbosity: Verbosity | Log) {
    if (typeof verbosity === `string`) {
      this.verbosity = verbosity;
    } else {
      this.verbosity = verbosity.verbosity;
    }
    this.prefix = prefix;
  }

  info(msg: any) {
    if (this.verbosity === `errors`) return;
    console.log(this.prefix, msg);
  }

  debug(msg: any) {
    if (this.verbosity !== `debug`) return;
    console.log(this.prefix, msg);

  }
}