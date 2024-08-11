import { colors } from '@common/constants.js';
import { c, handleErr, log } from '@log';
import { resetCommands } from '@scripts/resetCommands.js';

export interface ProcessArg {
  readonly name: string;
  readonly alias?: string;
  readonly description?: string;
}

export const argMap: Readonly<ProcessArg[]> = Object.freeze<ProcessArg[]>([
  {
    name: 'help',
    alias: 'h',
    description: 'Shows information about command line arguments.'
  },
  {
    name: 'skip-deploy',
    alias: 's',
    description: 'Skip refreshing commands with the Discord API.'
  },
  {
    name: 'reset-commands',
    alias: 'r',
    description: 'Resets global and dev guild commands.'
  }
]);

export async function handleArgs(processArgs: string[]): Promise<{ skipDeploy: boolean }> {
  const validArgs = argMap.flatMap(a => {
    const validArgNames = [`--${a.name}`];

    if (a.alias) validArgNames.push(`-${a.alias}`);

    return validArgNames;
  });

  const args = [
    ...new Set(
      processArgs
        .slice(2) // slice node executable and filename from args
        .filter(arg => validArgs.includes(arg)) // filter for supported args
        .map(arg => {
          if (!arg.startsWith('--')) {
            return argMap.find(a => a.alias === arg.slice(1))!.name;
          }

          return arg.slice(2);
        })
    )
  ];

  if (args.includes('help')) {
    log('process', `Command line arguments help:`);

    for (const arg of argMap) {
      log('process', '');
      log('process', `${c(`--${arg.name}`, colors.string)}${arg.alias ? `, ${c(`-${arg.alias}`, colors.string)}` : ''}`);
      log('process', arg.description ?? 'No argument description.');
    }

    process.exit(0);
  }

  if (args.includes('help')) {
    log('process', `Command line arguments help:`);

    for (const arg of argMap) {
      log('process', '');
      log('process', `${c(`--${arg.name}`, colors.string)}${arg.alias ? `, ${c(`-${arg.alias}`, colors.string)}` : ''}`);
      log('process', arg.description ?? 'No argument description.');
    }

    process.exit(0);
  }

  if (args.includes('reset-commands')) {
    log('process', 'Resetting global and dev guild commands...');

    await resetCommands()
      .then(() => log('process', 'Commands reset successfully.'))
      .catch(handleErr);

    process.exit(0);
  }

  return { skipDeploy: args.includes('skip-deploy') };
}
