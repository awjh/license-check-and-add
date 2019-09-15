import * as yargs from 'yargs';
import packageJSON from '../package.json';

/* istanbul ignore file */

const version = 'v' + packageJSON.version;

try {
    // tslint:disable-next-line: no-unused-expression
    yargs
    .commandDir('./cmds')
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
    console.error('Command failed');
    process.exit(1);
}
