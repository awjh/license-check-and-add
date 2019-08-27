import * as fs from 'fs-extra';
import { EOL } from 'os';
import { DEFAULT_FORMATS } from '../constants';
import { TrailingWhitespaceMode } from './config-parser';

export interface IAppendPrepend {
    append?: string;
    prepend?: string;
}

export interface ILicenseFormat extends IAppendPrepend {
    eachLine?: IAppendPrepend;
    file?: string;
}

export interface IFormatCollection {
    [s: string]: ILicenseFormat;
}

export class LicenseFormatter {

    public readonly defaultFormat: ILicenseFormat; // the format used when not found in list of configured formats
    public readonly licenseFormats: IFormatCollection;
    public readonly stripTrailingWhitespace: boolean; // tslint:disable-line: max-line-length -> useful for a format where you have a license with blank lines and prepend with a ' * ' so makes blank lines use ' *' instead

    constructor (defaultFormat: ILicenseFormat, trailingWhitespace: TrailingWhitespaceMode, declaredFormats?: IFormatCollection) {
        this.licenseFormats = this.separateFileTypesInFormat(DEFAULT_FORMATS);

        if (declaredFormats) {
            this.licenseFormats = Object.assign(this.licenseFormats, this.separateFileTypesInFormat(declaredFormats));
        }

        this.defaultFormat = defaultFormat;

        this.stripTrailingWhitespace = trailingWhitespace === TrailingWhitespaceMode.TRIM;
    }

    public formatLicenseForFile (extension: string, licenseText: string): string {
        let format = this.defaultFormat;
        licenseText = licenseText.trim();

        if (this.licenseFormats.hasOwnProperty(extension)) {
            format = this.licenseFormats[extension];
        }

        if (format.hasOwnProperty('file')) {
            return fs.readFileSync(format.file).toString(); // formatted license was just value in the file
        }

        if (format.hasOwnProperty('eachLine')) {
            let licenseLines = licenseText.split(/\r\n|\n/);

            licenseLines.forEach((line) => {
                if (format.eachLine.hasOwnProperty('prepend')) {
                    line = format.eachLine.prepend + line;
                }

                if (format.eachLine.hasOwnProperty('append')) {
                    line = line + format.eachLine.append;
                }
            });

            if (this.stripTrailingWhitespace) {
                licenseLines = licenseLines.map((line) => {
                    return line.replace(/\s+$/, '');
                });
            }
        }

        if (format.hasOwnProperty('prepend')) {
            licenseText = format.prepend + EOL + licenseText;
        }

        if (format.hasOwnProperty('append')) {
            licenseText = licenseText + EOL + format.append;
        }

        return licenseText;
    }

    private separateFileTypesInFormat (formats: IFormatCollection): IFormatCollection {
        const separated = {};

        Object.keys(formats).forEach((key) => {
            const splitKey = key.split('|');

            splitKey.forEach((fileType) => {
                separated['.' + fileType] = formats[key];
            });
        });

        return separated;
    }
}
