#!/usr/bin/env node

import * as fs from 'fs-extra';
import * as path from 'path';
import * as yargs from 'yargs';

/* istanbul ignore file */

let modulePath =  path.join(__dirname, '..');

if (path.basename(__dirname) === '.bin') {
    modulePath = path.join(__dirname, '../license-check-and-add');
}

const packageJSON = fs.readJSONSync(path.join(modulePath, '../package.json'));
const version = 'v' + packageJSON.version;

try {
    // tslint:disable-next-line: no-unused-expression
    yargs
    .commandDir(path.join(modulePath, 'src/cmds'), {exclude: /.*\.spec\.js/})
    .demandCommand(1, 'Need to specify a command')
    .help()
    .wrap(null)
    .alias('v', 'version')
    .version(version)
    .describe('v', 'show version information')
    .env('LICENCE_CHECK')
    .argv;

    console.log('Command succeeded');
    process.exit(0);
} catch (err) {
    console.error(err.message);
    console.error('Command failed');
    process.exit(1);
}
