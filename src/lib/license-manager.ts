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

    private paths: string[];
    private licenseFormatter: LicenseFormatter;
    private licenseText: string;
    private mode: ManagementMode;
    private outputPath: string;

    constructor (
        paths: string[], licenseText: string, declaredFormats: IFormatCollection, defaultFormat: ILicenseFormat,
        trailingWhitespace: TrailingWhitespaceMode, mode: ManagementMode, outputPath: string,
    ) {
        this.paths = paths;
        this.licenseFormatter = new LicenseFormatter(declaredFormats, defaultFormat, trailingWhitespace);
        this.licenseText = licenseText;
        this.mode = mode;
        this.outputPath = outputPath;
    }

    public manage () {
        const missingLicenses = [];
        let insertedLicenses = 0;
        let removedLicenses = 0;

        this.paths.forEach((filePath) => {
            const fileContents = fs.readFileSync(filePath).toString();

            const extension = path.extname(filePath) ? path.extname(filePath) : path.basename(filePath);

            const formattedLicense = this.licenseFormatter.formatLicenseForFile(extension, this.licenseText);

            if (!fileContents.includes(formattedLicense)) {
                if (this.mode === ManagementMode.INSERT) {
                    this.insertLicense(fileContents, formattedLicense, filePath);
                    insertedLicenses++;
                } else {
                    console.error('\x1b[31m\u2717\x1b[0m License not found in', filePath);
                    missingLicenses.push(filePath);
                }
            } else if (this.mode === ManagementMode.REMOVE) {
                this.removeLicense(fileContents, formattedLicense, filePath);
                removedLicenses++;
            }
        });

        if (this.mode !== ManagementMode.REMOVE) {
            if (this.mode === ManagementMode.INSERT) {
                console.log(`\x1b[33m!\x1b[0m Inserted license into ${insertedLicenses} file(s)`);
            } else if (this.mode === ManagementMode.CHECK && this.outputPath) {
                fs.writeFileSync(this.outputPath, missingLicenses.join(EOL));
            }

            if (missingLicenses.length > 0) {
                throw new Error(`License Check failed. ${missingLicenses.length} file(s) did not have the license.`);
            }
            console.log('\x1b[32m\u2714\x1b[0m All files have licenses.');
        } else {
            console.log(`\x1b[32m\u2714\x1b[0m Removed license from ${removedLicenses} file(s).`);
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
                    return nextLine === licenseLines[subsetIdx];
                });

                if (match) {
                    const newLines = fileLines.splice(idx, formattedLicense.length);
                    fs.writeFileSync(filePath, newLines.join(EOL));

                    return true; // break out assume one license per file
                }
            }

            return false;
        });
    }
}
