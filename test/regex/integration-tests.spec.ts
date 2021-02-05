import * as chai from 'chai';
import * as childProcess from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import { directoriesMatch } from '../utils';

const expect = chai.expect;

describe ('#Regex', () => {

    const packageJson = fs.readJSONSync(path.resolve(__dirname, '../../package.json'));

    const pwd = process.cwd();

    const tmp = '/tmp/license-check-and-add';
    const bin = path.resolve(__dirname, '../..', packageJson.bin['license-check-and-add']);
    const config = path.resolve(__dirname, 'license-check-and-add-config.json');

    before (() => {
        fs.copySync(path.resolve(__dirname, 'original-files'), tmp);
        fs.copyFileSync(path.resolve(__dirname, '.ignorefile'), path.resolve(tmp, '.ignorefile'));
        process.chdir(tmp);
    });

    after (() => {
        process.chdir(pwd);
        fs.removeSync(tmp);
    });

    describe ('Check licenses', () => {
        it ('should check licenses', () => {
            expect(() => {
                childProcess.execSync(`node ${bin} check -f ${config}`);
            }).to.throw(/5 file\(s\) did not have the license/);
        });
    });

    describe ('Insert licenses', () => {
        it ('should error when the regex does not match the value to be inserted', () => {
            expect(() => {
                childProcess.execSync(`node ${bin} add -f ${config} -r bellO02`).toString();
            }).to.throw(/Replacement value bellO02 does not match regex it is to replace: \[a\-z\]\{4\}\[0\-9\]\{3\}/);
        });

        it ('should insert the license into those without', () => {
            const goalFilesDir = path.resolve(__dirname, 'goal-files/insert');

            const stdout = childProcess.execSync(`node ${bin} add -f ${config} -r bell002`).toString();

            // tslint:disable-next-line: no-unused-expression
            expect(directoriesMatch(tmp, goalFilesDir)).to.be.true;
            expect(stdout).to.match(/Inserted license into 5 file\(s\)/);
        });
    });

    describe ('Remove licenses', () => {
        it ('should remove the license from those with', () => {
            const goalFilesDir = path.resolve(__dirname, 'goal-files/remove');

            const stdout = childProcess.execSync(`node ${bin} remove -f ${config}`).toString();

            // tslint:disable-next-line: no-unused-expression
            expect(directoriesMatch(tmp, goalFilesDir)).to.be.true;
            expect(stdout).to.match(/Removed license from 6 file\(s\)/);
        });
    });
});
