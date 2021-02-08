import * as fs from 'fs-extra';
import { EOL } from 'os';
import * as path from 'path';
import { IRegexConfig, TrailingWhitespaceMode } from './config-parser';
import { IFormatCollection, ILicenseFormat, LicenseFormatter } from './license-formatter';

export enum ManagementMode {
    CHECK = 1,
    INSERT,
    REMOVE,
}

const REGEX_MARKER = 'I_AM_A_REGEX_MARKER';

export class LicenseManager {

    public readonly paths: string[];
    public readonly licenseFormatter: LicenseFormatter;
    public readonly licenseText: string;
    public readonly mode: ManagementMode;
    public readonly outputPath: string;
    public readonly trailingWhitespace: TrailingWhitespaceMode;
    public readonly regex: IRegexConfig;

    private readonly formattedLicenses: Map<string, {formatted: string, normalised: string}>;

    constructor (
        paths: string[], licenseText: string, declaredFormats: IFormatCollection, defaultFormat: ILicenseFormat,
        trailingWhitespace: TrailingWhitespaceMode, mode: ManagementMode, outputPath?: string, regex?: IRegexConfig,
    ) {
        this.paths = paths;
        this.licenseFormatter = declaredFormats ?
            new LicenseFormatter(defaultFormat, trailingWhitespace, declaredFormats) :
            new LicenseFormatter(defaultFormat, trailingWhitespace);
        this.licenseText = licenseText;
        this.mode = mode;
        this.outputPath = outputPath;
        this.trailingWhitespace = trailingWhitespace;
        this.regex = regex;
        this.formattedLicenses = new Map();
    }

    public manage () {
        const missingLicenses = [];
        const insertedLicenses = [];
        const removedLicenses = [];

        this.paths.forEach((filePath) => {
            const fileContents = fs.readFileSync(filePath).toString();
            const normalisedFileContents = this.formatForCheck(fileContents, false, this.regex);

            const extension = path.extname(filePath) ? path.extname(filePath) : path.basename(filePath);

            let existing: {formatted: string, normalised: string};

            if (this.formattedLicenses.has(extension)) {
                existing = this.formattedLicenses.get(extension);
            }

            const formattedLicense = existing ? existing.formatted
                                              : this.licenseFormatter.formatLicenseForFile(extension, this.licenseText);
            const normalisedLicense = existing ? existing.normalised
                                               : this.formatForCheck(formattedLicense, true, this.regex);

            if (!existing) {
                this.formattedLicenses.set(extension, {formatted: formattedLicense, normalised: normalisedLicense});
            }

            if (!normalisedFileContents.match(new RegExp(normalisedLicense))) {
                if (this.mode === ManagementMode.INSERT) {
                    this.insertLicense(fileContents, formattedLicense, filePath, this.regex as IRegexConfig);
                    insertedLicenses.push(filePath);
                } else if (this.mode === ManagementMode.CHECK) {
                    console.error('\x1b[31m\u2717\x1b[0m License not found in', filePath);
                    missingLicenses.push(filePath);
                }
            } else if (this.mode === ManagementMode.REMOVE) {
                this.removeLicense(fileContents, normalisedLicense, filePath);
                removedLicenses.push(filePath);
            }
        });

        if (this.outputPath) {
            switch (this.mode) {
                case ManagementMode.INSERT: fs.writeFileSync(this.outputPath, insertedLicenses.join(EOL)); break;
                case ManagementMode.CHECK: fs.writeFileSync(this.outputPath, missingLicenses.join(EOL)); break;
                case ManagementMode.REMOVE: fs.writeFileSync(this.outputPath, removedLicenses.join(EOL)); break;
            }
        }

        if (this.mode !== ManagementMode.REMOVE) {
            /* istanbul ignore else  */
            if (this.mode === ManagementMode.INSERT) {
                console.log(`\x1b[33m!\x1b[0m Inserted license into ${insertedLicenses.length} file(s)`);
            } else if (this.mode === ManagementMode.CHECK) {
                if (missingLicenses.length > 0) {
                    throw new Error(`License check failed. ${missingLicenses.length} file(s) did not have the license.`);
                }

                console.log('\x1b[32m\u2714\x1b[0m All files have licenses.');
            }
        } else {
            console.log(`\x1b[32m\u2714\x1b[0m Removed license from ${removedLicenses.length} file(s).`);
        }
    }

    private insertLicense (
        fileContents: string, formattedLicense: string, filePath: string,
        regex?: IRegexConfig,
    ) {
        let newText = '';

        if (regex) {
            let identifierChoice = 0;

            formattedLicense = formattedLicense.split(/\r?\n/).map((line) => {
                return line.split(regex.identifier).map((el, idx) => {
                    if (idx % 2 === 0) {
                        return el;
                    } else {
                        let replacement = regex.replacements[0];

                        if (regex.replacements.length > 1) {
                            if (identifierChoice === regex.replacements.length) {
                                throw new Error(
                                    `Too few replacement values passed. Found at least ${identifierChoice + 1} regex values. ` +
                                    `Only have ${regex.replacements.length} replacements`,
                                );
                            }

                            replacement = regex.replacements[identifierChoice++];
                        }

                        if (!replacement.match(el)) {
                            throw new Error(`Replacement value ${replacement} does not match regex it is to replace: ${el}`);
                        }

                        return replacement;
                    }
                }).join('');
            }).join(EOL);
        }

        if (fileContents.startsWith('#!')) {
            const lines = fileContents.split(/\r?\n/);

            newText = lines[0] + EOL + formattedLicense;

            lines.shift();

            newText += EOL + lines.join(EOL);

        } else {
            newText = formattedLicense + EOL + fileContents;
        }

        fs.writeFileSync(filePath, newText);
    }

    private removeLicense (fileContents: string, normalisedLicense: string, filePath: string) {
        const fileLines = fileContents.split(/\r?\n/);
        const licenseLines = normalisedLicense.split(/\r?\n/).map((line) => '^' + line);

        fileLines.some((fileLine, idx) => {
            if (fileLine.match(licenseLines[0])) {
                const match = fileLines.slice(idx + 1, idx + licenseLines.length).every((nextLine, subsetIdx) => {
                    return nextLine.match(licenseLines[subsetIdx + 1]);
                });

                if (match) {
                    fileLines.splice(idx, licenseLines.length);
                    fs.writeFileSync(filePath, fileLines.join(EOL));

                    return true; // break out assume one license per file
                }
            }

            return false;
        });
    }

    private formatForCheck (textBlock: string, escapeRegex: boolean, regex?: IRegexConfig) {
        const regexIdentifier = regex ? regex.identifier : null;

        let regexes;

        if (regexIdentifier) {
            const split = textBlock.split(regexIdentifier);

            if (split.length % 2 === 0) {
                throw new Error('Odd number of regex identifiers found. One must be missing its close');
            }

            textBlock = split.filter((_, idx) => idx % 2 === 0).join(REGEX_MARKER);
            regexes = split.filter((_, idx) => idx % 2 !== 0);
        }

        let formatted = textBlock.split(/\r?\n/).map((line) => {
            return this.trailingWhitespace === TrailingWhitespaceMode.DEFAULT ? line.replace(/\s+$/, '') : line;
        }).join('\n');

        if (escapeRegex) {
            formatted = formatted.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // ESCAPE READY FOR REGEX
            .split(REGEX_MARKER).map((el, idx, orig) => {
                return idx !== orig.length - 1 ? el + regexes[idx] : el;
            }).join('');
        }

        return formatted;
    }
}
