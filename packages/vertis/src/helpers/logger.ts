// Helpers
import c from 'chalk';

type LoggerLevel = 'debug'|'info'|'warn'|'error';

class Logger {
  // Attributes
  public name: string|null;
  // Constructor
  constructor (name?: string) {
    this.name = name || null;
  }
  // Methods
	public pure (msg: SafeAny, level: LoggerLevel = 'info'): void {
    console[level](msg);
  }
  public debug (msg: SafeAny): void {
    console.debug(c.gray(this.computeMessage(msg)));
  }
  public info (msg: SafeAny): void {
    console.info(c.cyan(this.computeMessage(msg)));
  }
	public success (msg: SafeAny): void {
    console.info(c.green(this.computeMessage(msg)));
  }
  public warn (msg: SafeAny): void {
    console.warn(c.yellow(this.computeMessage(msg)));
  }
  public error (msg: SafeAny): void {
    console.error(c.red(this.computeMessage(msg)));
  }
	private computeMessage (msg: SafeAny) {
		return this.name ? `${c.cyan(`[${this.name}]`)} ${msg}` : msg;
	}
}

export const logger = new Logger();
