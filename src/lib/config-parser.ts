import * as fs from 'fs-extra';
import gitignoreToGlob from 'gitignore-to-glob';
import * as path from 'path';
import { DEFAULT_FORMAT } from '../constants';
import { IFormatCollection } from './license-formatter';

export enum TrailingWhitespaceMode {
    DEFAULT = 0,
    TRIM,
}

export interface IInputConfig {
    defaultFormat?: object;
    ignoreDefaultIgnores?: boolean;
    ignore: string | string[];
    license: string;
    licenseFormats?: IFormatCollection;
    output?: string; // could make it a command line option e.g. -o formats it nicely and then they can pipe it out to whatever
    trailingWhitespace?: string;
}

export interface IConfig {
    defaultFormat: object;
    ignoreDefaultIgnores: boolean;
    ignore: string[];
    license: string;
    licenseFormats: IFormatCollection;
    output?: string;
    trailingWhitespace: TrailingWhitespaceMode;
}

const REQUIRED_FIELDS: string[] = ['ignore', 'license'];

export function configParser (filePath: string): IConfig {
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
        trailingWhitespace: TrailingWhitespaceMode.DEFAULT,
    };

    if (!Array.isArray(fileConfig.ignore)) {
        console.debug('Using ignore file');
        config.ignore = gitignoreToGlob(path.resolve(process.cwd(), fileConfig.ignore as string));
    } else {
        config.ignore = fileConfig.ignore as string[];
    }

    if (!fileConfig.defaultFormat) {
        console.warn(`No default format specified using ${JSON.stringify(DEFAULT_FORMAT)} as backup`);
    }

    if (fileConfig.trailingWhitespace && fileConfig.trailingWhitespace.toUpperCase() === 'TRIM') {
        config.trailingWhitespace = TrailingWhitespaceMode.TRIM;
    }

    if (fileConfig.output) {
        config.output = path.resolve(process.cwd(), fileConfig.output);
    }

    return config;
}
