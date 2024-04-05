/**
 * Represents an env variable.
 */
export interface EnvVar {
  key: string;
  type: 'string' | 'number' | 'boolean';
}

/**
 * Checks if the specified env variables are defined and valid. Throws if any variables don't pass.
 */
export function checkEnv(vars: EnvVar[]): void {
  for (const v of vars) {
    if (typeof process.env[v.key] !== 'string') throw new TypeError(`Env variable \`${v.key}\` is undefined!`);

    const value: string = process.env[v.key]!;

    if (v.type === 'boolean') {
      if (!['true', 'false'].includes(value)) throw new TypeError(`Expected env variable \`${v.key}\` to be a boolean, received \`${value}\` instead.`);
      return;
    }

    if (v.type === 'number') {
      const n = Number(value);

      if (isNaN(n)) throw new TypeError(`Expected env variable \`${v.key}\` to be a number, received \`${value}\` instead.`);

      if (n > Number.MAX_SAFE_INTEGER || n < Number.MIN_SAFE_INTEGER) throw new RangeError(`Env variable \`${v.key}\` exceedes the JavaScript safe number range!`);

      return;
    }
  }
}
