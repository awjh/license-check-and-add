import { Argv, CommandModule, Options } from 'yargs';
import { Arguments, OPTIONS } from '../constants';
import { ManagementMode } from '../lib/license-manager';
import { addExports, manageLicense } from './utils';

const ADD_OPTIONS: {[s: string]: Options} = {
    'regex-replacement': {
        alias: ['r'],
        required: false,
        type: 'string',
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
