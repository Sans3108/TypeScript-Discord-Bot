import { colors } from '@common/constants.js';
import { c, log } from '@log';

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
    description: 'Skip deploying commands on the Discord API.'
  },
  {
    name: 'empty-deploy',
    alias: 'e',
    description: 'Deploy an emtpy set of commands, effectively removing all commands.'
  }
]);

export function handleArgs(processArgs: string[]): { skipDeploy: boolean; emptyDeploy: boolean } {
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

  let skipDeploy: boolean = args.includes('skip-deploy');

  if (args.includes('empty-deploy') && skipDeploy) {
    log('process', `Ignoring --skip-deploy (-s) flag due to the presence of the --empty-deploy (-e) flag...`);

    skipDeploy = false;
  }

  return { skipDeploy, emptyDeploy: args.includes('empty-deploy') };
}
