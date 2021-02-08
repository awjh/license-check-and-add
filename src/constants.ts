import * as path from 'path';
import { Arguments as YargsArguments, Options } from 'yargs';
import { IFormatCollection, ILicenseFormat } from './lib/license-formatter';

export type Arguments = YargsArguments & {
    'config-file': string;
    'regex-replacements': string[];
    done?: Promise<any>;
};

export const OPTIONS: {[s: string]: Options} = {
    'config-file': {
        alias: ['f'],
        default: path.join(process.cwd(), 'license-checker-config.json'),
        required: false,
        type: 'string',
    },
};

export const CONFIG_OPTION = 'config-file';
export const REGEX_OPTION = 'regex-replacements';

// tslint:disable: object-literal-sort-keys
export const DEFAULT_FORMAT: ILicenseFormat = {
    prepend: '/*',
    append: '*/',
};

export const DEFAULT_FORMATS: IFormatCollection = {
    'gitignore|npmignore|eslintignore|dockerignore|sh|py': {
        eachLine: {
            prepend: '# ',
        },
    },
    'html|xml|svg': {
        prepend: '<!--',
        append: '-->',
    },
    'js|ts|css|scss|less|php|as|c|java|cpp|go|cto|acl': {
        prepend: '/*',
        append: '*/',
    },
    txt: {},
};
// tslint:enable: object-literal-sort-keys
