import { Argv, CommandModule, Options } from 'yargs';
import { Arguments, OPTIONS } from '../constants';
import { ManagementMode } from '../lib/license-manager';
import { addExports, manageLicense } from './utils';

const ADD_OPTIONS: {[s: string]: Options} = {
    'regex-replacements': {
        alias: ['r'],
        // tslint:disable-next-line: max-line-length
        description: 'Values to use where regex exists in the given license, first value will replace first regex instance and so on. If only one value is supplied this will replace all instances.',
        required: false,
        type: 'array',
    },
};

const cmd: CommandModule = {
    builder: (yargs: Argv): Argv =>  {
        yargs.options(Object.assign(OPTIONS, ADD_OPTIONS));
        yargs.usage('license-check-and-add add');

        return yargs;
    },
    command: 'add [options]',
    handler: (args: Arguments): void => {
        manageLicense(args, ManagementMode.INSERT);
    },
};

addExports(exports, cmd);
