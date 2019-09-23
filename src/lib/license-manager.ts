import * as fs from 'fs-extra';
import { EOL } from 'os';
import * as path from 'path';
import { TrailingWhitespaceMode } from './config-parser';
import { IFormatCollection, ILicenseFormat, LicenseFormatter } from './license-formatter';

export enum ManagementMode {
    CHECK = 1,
    INSERT,
    REMOVE,
}

export class LicenseManager {

    public readonly paths: string[];
    public readonly licenseFormatter: LicenseFormatter;
    public readonly licenseText: string;
    public readonly mode: ManagementMode;
    public readonly outputPath: string;

    constructor (
        paths: string[], licenseText: string, declaredFormats: IFormatCollection, defaultFormat: ILicenseFormat,
        trailingWhitespace: TrailingWhitespaceMode, mode: ManagementMode, outputPath: string,
    ) {
        this.paths = paths;
        this.licenseFormatter = declaredFormats ?
            new LicenseFormatter(defaultFormat, trailingWhitespace, declaredFormats) :
            new LicenseFormatter(defaultFormat, trailingWhitespace);
        this.licenseText = licenseText;
        this.mode = mode;
        this.outputPath = outputPath;
    }

    public manage () {
        const missingLicenses = [];
        const insertedLicenses = [];
        const removedLicenses = [];

        this.paths.forEach((filePath) => {
            const fileContents = fs.readFileSync(filePath).toString();

            const extension = path.extname(filePath) ? path.extname(filePath) : path.basename(filePath);

            const formattedLicense = this.licenseFormatter.formatLicenseForFile(extension, this.licenseText);

            if (!fileContents.includes(formattedLicense)) {
                if (this.mode === ManagementMode.INSERT) {
                    this.insertLicense(fileContents, formattedLicense, filePath);
                    insertedLicenses.push(filePath);
                } else if (this.mode === ManagementMode.CHECK) {
                    console.error('\x1b[31m\u2717\x1b[0m License not found in', filePath);
                    missingLicenses.push(filePath);
                }
            } else if (this.mode === ManagementMode.REMOVE) {
                this.removeLicense(fileContents, formattedLicense, filePath);
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

    private insertLicense (fileContents: string, formattedLicense: string, filePath: string) {
        let newText = '';

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

    private removeLicense (fileContents: string, formattedLicense: string, filePath: string) {
        const fileLines = fileContents.split(/\r?\n/);
        const licenseLines = formattedLicense.split(/\r?\n/);

        fileLines.some((fileLine, idx) => {
            if (fileLine === licenseLines[0]) {
                const match = fileLines.slice(idx + 1, idx + licenseLines.length).every((nextLine, subsetIdx) => {
                    return nextLine === licenseLines[subsetIdx + 1];
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
}
