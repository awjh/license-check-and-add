import * as fs from 'fs-extra';
import * as path from 'path';
import { DEFAULT_FORMAT } from '../constants';
import { IFormatCollection, ILicenseFormat } from './license-formatter';
import { ManagementMode } from './license-manager';

export enum TrailingWhitespaceMode {
    DEFAULT = 0,
    TRIM,
}

export interface IInputConfig {
    defaultFormat?: ILicenseFormat;
    ignoreDefaultIgnores?: boolean;
    ignore?: string | string[];
    license: string;
    licenseFormats?: IFormatCollection;
    output?: string; // could make it a command line option e.g. -o formats it nicely and then they can pipe it out to whatever
    regexIdentifier?: string;
    trailingWhitespace?: 'DEFAULT' | 'TRIM';
}

export interface IConfig {
    defaultFormat: ILicenseFormat;
    ignoreDefaultIgnores: boolean;
    ignore: string | string[];
    license: string;
    licenseFormats: IFormatCollection;
    output?: string;
    regexIdentifier?: string;
    regexReplacement?: string;
    trailingWhitespace: TrailingWhitespaceMode;
}

const REQUIRED_FIELDS: string[] = ['license'];

export function configParser (filePath: string, mode: ManagementMode, regexReplacement?: string): IConfig {
    const fileConfig = fs.readJSONSync(filePath) as IInputConfig;

    for (const REQUIRED_FIELD of REQUIRED_FIELDS) {
        if (!fileConfig.hasOwnProperty(REQUIRED_FIELD)) {
            throw new Error('Missing required field in config: ' + REQUIRED_FIELD);
        }
    }

    const config: IConfig = {
        defaultFormat: fileConfig.defaultFormat || DEFAULT_FORMAT,
        ignore: [],
        ignoreDefaultIgnores: fileConfig.ignoreDefaultIgnores || false,
        license: fs.readFileSync(path.resolve(process.cwd(), fileConfig.license)).toString(),
        licenseFormats: fileConfig.licenseFormats || {},
        regexIdentifier: fileConfig.regexIdentifier,
        trailingWhitespace: TrailingWhitespaceMode.DEFAULT,
    };

    if (!fileConfig.ignore) {
        console.debug('No ignore specified. Using []');
        config.ignore = [];
    } else {
        config.ignore = fileConfig.ignore;
    }

    if (!fileConfig.defaultFormat) {
        console.warn(`No default format specified. Using ${JSON.stringify(DEFAULT_FORMAT)} as backup`);
    }

    if (fileConfig.trailingWhitespace && fileConfig.trailingWhitespace.toUpperCase() === 'TRIM') {
        config.trailingWhitespace = TrailingWhitespaceMode.TRIM;
    }

    if (fileConfig.output) {
        config.output = path.resolve(process.cwd(), fileConfig.output);
    }

    if (regexReplacement) {
        config.regexReplacement = regexReplacement;
    } else if (fileConfig.regexIdentifier && mode === ManagementMode.INSERT) {
        throw new Error('Must supply regexReplacement option when using regexIdentifier in config when in INSERT mode');
    }

    return config;
}
