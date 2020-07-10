import * as path from 'path';
import { CommandModule } from 'yargs';
import { Arguments, CONFIG_OPTION, REGEX_OPTION } from '../constants';
import { configParser } from '../lib/config-parser';
import { getPaths } from '../lib/file-finder';
import { LicenseManager, ManagementMode } from '../lib/license-manager';

export function addExports (exports, command: CommandModule) {
    for (const key in command) {
        /* istanbul ignore else  */
        if (command.hasOwnProperty(key)) {
            exports[key] = command[key];
        }
    }
}

export function manageLicense (args: Arguments, mode: ManagementMode) {
    const config = configParser(path.resolve(process.cwd(), args[CONFIG_OPTION]), mode, args[REGEX_OPTION]);
    const paths = getPaths(config.ignore, config.ignoreDefaultIgnores);

    const licenseManager = new LicenseManager(
        paths, config.license, config.licenseFormats, config.defaultFormat,
        config.trailingWhitespace, mode, config.output,
    );

    licenseManager.manage();
}
