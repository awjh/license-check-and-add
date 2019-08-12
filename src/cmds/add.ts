import { Argv, CommandModule } from 'yargs';
import { Arguments, OPTIONS } from '../constants';
import { ManagementMode } from '../lib/license-manager';
import { addExports, manageLicense } from './utils';

const cmd: CommandModule = {
    builder: (yargs: Argv): Argv =>  {
        yargs.options(OPTIONS);
        yargs.usage('license-check-and-add add');

        return yargs;
    },
    command: 'add [options]',
    handler: (args: Arguments): void => {
        manageLicense(args, ManagementMode.INSERT);
    },
};

addExports(exports, cmd);
