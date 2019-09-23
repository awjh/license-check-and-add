import * as chai from 'chai';
import * as childProcess from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';

const expect = chai.expect;

describe ('#Scenario', () => {

    const packageJson = fs.readJSONSync(path.resolve(__dirname, '../package.json'));

    const pwd = process.cwd();

    const tmp = '/tmp/license-check-and-add';
    const bin = path.resolve(__dirname, '..', packageJson.bin['license-check-and-add']);
    const config = path.resolve(__dirname, 'license-check-and-add-config.json');

    before (() => {
        fs.copySync(path.resolve(__dirname, 'original-files'), tmp);
        process.chdir(tmp);
    });

    after (() => {
        process.chdir(pwd);
        fs.removeSync(tmp);
    });

    describe ('Check licenses', () => {
        console.log(`node ${bin} check -f ${config}`);
        it ('should check licenses', () => {
            expect(() => {
                childProcess.execSync(`node ${bin} check -f ${config}`);
            }).to.throw(/4 file\(s\) did not have the license/);
        });
    });

    describe ('Insert licenses', () => {
        it ('should insert the license into those without', () => {
            const goalFilesDir = path.resolve(__dirname, 'goal-files/insert');

            const stdout = childProcess.execSync(`node ${bin} add -f ${config}`).toString();

            // tslint:disable-next-line: no-unused-expression
            expect(directoriesMatch(tmp, goalFilesDir)).to.be.true;
            expect(stdout).to.match(/Inserted license into 4 file\(s\)/);
        });
    });

    describe ('Remove licenses', () => {
        it ('should remove the license from those with', () => {
            const goalFilesDir = path.resolve(__dirname, 'goal-files/remove');

            const stdout = childProcess.execSync(`node ${bin} remove -f ${config}`).toString();

            // tslint:disable-next-line: no-unused-expression
            expect(directoriesMatch(tmp, goalFilesDir)).to.be.true;
            expect(stdout).to.match(/Removed license from 5 file\(s\)/);
        });
    });
});

function directoriesMatch (original, goal): boolean {
    return fs.readdirSync(original).every((fileOrDir) => {
        const fullPath = path.resolve(original, fileOrDir);
        const goalPath = path.resolve(goal, fileOrDir);

        if (fs.lstatSync(fullPath).isDirectory()) {
            return directoriesMatch(fullPath, goalPath);
        }

        return fs.readFileSync(fullPath).toString() === fs.readFileSync(goalPath).toString();
    });
}
