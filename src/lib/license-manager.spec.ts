
import * as chai from 'chai';
import * as mockery from 'mockery';
import { EOL } from 'os';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { string } from 'yargs';
import { DEFAULT_FORMAT } from '../constants';
import { IRegexConfig, TrailingWhitespaceMode } from './config-parser';
import { IFormatCollection, LicenseFormatter } from './license-formatter';
import { LicenseManager as LicenseManagerDef, ManagementMode } from './license-manager';

const expect = chai.expect;
chai.use(sinonChai);

// tslint:disable: no-unused-expression

describe ('#LicenseManager', () => {

    let sandbox: sinon.SinonSandbox;
    let LicenseManager: typeof LicenseManagerDef;
    let LicenseFormatterStub: sinon.SinonStub;
    let mockLicenseFormatter: sinon.SinonStubbedInstance<LicenseFormatter>;
    let licenseManager: LicenseManagerDef;

    const mockFormats: IFormatCollection = {
        css: {
            eachLine: {
                append: ' */',
                prepend: '/*',
            },
            prepend: ' * ',
        },
        js: {
            eachLine: {
                append: ' */',
                prepend: '/*',
            },
            prepend: ' * ',
        },
        sh: {
            eachLine: {
                prepend: '# ',
            },
        },
    };

    const mockRegex: IRegexConfig = {
        identifier: '##',
    };

    before (() => {
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false,
        });
    });

    beforeEach (() => {
        sandbox = sinon.createSandbox();
        mockLicenseFormatter = sinon.createStubInstance(LicenseFormatter);
        LicenseFormatterStub = sandbox.stub().returns(mockLicenseFormatter);

        mockery.registerMock('./license-formatter', { LicenseFormatter: LicenseFormatterStub });

        delete require.cache[require.resolve('./license-manager')];
        LicenseManager = require('./license-manager').LicenseManager;
    });

    afterEach(() => {
        sandbox.restore();
        mockery.deregisterAll();
    });

    after(() => {
        mockery.disable();
    });

    describe ('constructor', () => {
        it ('should configure with a license formatter that lacks declared formats', () => {
            licenseManager = new LicenseManager(
                ['some', 'paths'], 'some license text', null, DEFAULT_FORMAT,
                TrailingWhitespaceMode.TRIM, ManagementMode.CHECK, 'some output path',
            );

            expect(licenseManager.paths).to.deep.equal(['some', 'paths']);
            expect(LicenseFormatterStub).to.have.been.calledOnceWithExactly(DEFAULT_FORMAT, TrailingWhitespaceMode.TRIM);
            expect(licenseManager.licenseFormatter).to.deep.equal(mockLicenseFormatter);
            expect(licenseManager.mode).to.deep.equal(ManagementMode.CHECK);
            expect(licenseManager.outputPath).to.deep.equal('some output path');
        });

        it ('should configure with a license formatter that has declared formats', () => {
            licenseManager = new LicenseManager(
                ['some', 'paths'], 'some license text', mockFormats, DEFAULT_FORMAT,
                TrailingWhitespaceMode.DEFAULT, ManagementMode.INSERT, 'some output path',
            );

            expect(licenseManager.paths).to.deep.equal(['some', 'paths']);
            expect(LicenseFormatterStub).to.have.been.calledOnceWithExactly(DEFAULT_FORMAT, TrailingWhitespaceMode.DEFAULT, mockFormats);
            expect(licenseManager.licenseFormatter).to.deep.equal(mockLicenseFormatter);
            expect(licenseManager.mode).to.deep.equal(ManagementMode.INSERT);
            expect(licenseManager.outputPath).to.deep.equal('some output path');
        });

        it ('should configure with a regex value when supplied', () => {
            licenseManager = new LicenseManager(
                ['some', 'paths'], 'some license text', null, DEFAULT_FORMAT,
                TrailingWhitespaceMode.TRIM, ManagementMode.CHECK, 'some output path', mockRegex,
            );

            expect(licenseManager.paths).to.deep.equal(['some', 'paths']);
            expect(LicenseFormatterStub).to.have.been.calledOnceWithExactly(DEFAULT_FORMAT, TrailingWhitespaceMode.TRIM);
            expect(licenseManager.licenseFormatter).to.deep.equal(mockLicenseFormatter);
            expect(licenseManager.mode).to.deep.equal(ManagementMode.CHECK);
            expect(licenseManager.outputPath).to.deep.equal('some output path');
            expect(licenseManager.regex).to.deep.equal(mockRegex);
        });
    });

    describe('manage', () => {
        let fsReadFileStub: sinon.SinonStub;
        let fsWriteFileStub: sinon.SinonStub;
        let consoleLogStub: sinon.SinonStub;
        let consoleErrorStub: sinon.SinonStub;

        beforeEach (() => {
            mockLicenseFormatter.formatLicenseForFile.returnsArg(1);
            fsReadFileStub = sandbox.stub().onFirstCall().returns('file without license')
                .onSecondCall().returns('some license\nin the file');
            fsWriteFileStub = sandbox.stub();
            consoleLogStub = sandbox.stub(console, 'log');
            consoleErrorStub = sandbox.stub(console, 'error');

            mockery.registerMock('fs-extra', { readFileSync: fsReadFileStub, writeFileSync: fsWriteFileStub });

            delete require.cache[require.resolve('./license-manager')];
            LicenseManager = require('./license-manager').LicenseManager;

            licenseManager = new LicenseManager(
                ['some.txt', '.dotfile'], 'some license', mockFormats, DEFAULT_FORMAT,
                TrailingWhitespaceMode.DEFAULT, ManagementMode.CHECK,
            );
        });

        function expect_to_read_files () {
            expect(fsReadFileStub.callCount).to.deep.equal(2);
            expect(fsReadFileStub).to.have.been.calledWithExactly('some.txt');
            expect(fsReadFileStub).to.have.been.calledWithExactly('.dotfile');
        }

        function expect_to_format_license (licenseText: string = 'some license') {
            expect(mockLicenseFormatter.formatLicenseForFile.callCount).to.deep.equal(2);
            expect(mockLicenseFormatter.formatLicenseForFile).to.have.been.calledWithExactly('.txt', licenseText);
            expect(mockLicenseFormatter.formatLicenseForFile).to.have.been.calledWithExactly('.dotfile', licenseText);
        }

        it ('should throw an error when missing licenses in check mode', () => {
            (licenseManager as any).mode = ManagementMode.CHECK;

            expect(() => {
                licenseManager.manage();
            }).to.throw(/License check failed. 1 file/);

            expect_to_read_files();
            expect_to_format_license();

            expect(fsWriteFileStub).to.not.have.been.called;
            expect(consoleLogStub).to.not.have.been.called;
            expect(consoleErrorStub).to.have.been.calledOnceWithExactly(sinon.match(/License not found in/), 'some.txt');
        });

        it ('should not throw an error when all files have license in check mode', () => {
            fsReadFileStub.onFirstCall().returns('some license');

            (licenseManager as any).mode = ManagementMode.CHECK;

            licenseManager.manage();

            expect_to_read_files();
            expect_to_format_license();

            expect(fsWriteFileStub).to.not.have.been.called;
            expect(consoleErrorStub).to.not.have.been.called;
            expect(consoleLogStub).to.have.been.calledOnceWithExactly(sinon.match(/All files have licenses/));
        });

        it ('should throw an error when missing licenses in check mode using regex license template', () => {
            licenseManager = new LicenseManager(
                ['some.txt', '.dotfile'], 'some ##l{2}icense##', mockFormats, DEFAULT_FORMAT,
                TrailingWhitespaceMode.DEFAULT, ManagementMode.CHECK, null, mockRegex,
            );

            expect(() => {
                licenseManager.manage();
            }).to.throw(/License check failed. 2 file\(s\)/);

            expect_to_read_files();
            expect_to_format_license('some ##l{2}icense##');

            expect(fsWriteFileStub).to.not.have.been.called;
            expect(consoleLogStub).to.not.have.been.called;
            expect(consoleErrorStub).to.have.been.calledTwice;
            expect(consoleErrorStub).to.have.been.calledWithExactly(sinon.match(/License not found in/), '.dotfile');
            expect(consoleErrorStub).to.have.been.calledWithExactly(sinon.match(/License not found in/), 'some.txt');
        });

        it ('should not throw an error when all files have license in check mode using regex license template', () => {
            fsReadFileStub.onFirstCall().returns('some license');

            licenseManager = new LicenseManager(
                ['some.txt', '.dotfile'], 'some ##l{1}icense##', mockFormats, DEFAULT_FORMAT,
                TrailingWhitespaceMode.DEFAULT, ManagementMode.CHECK, null, mockRegex,
            );

            licenseManager.manage();

            expect_to_read_files();
            expect_to_format_license('some ##l{1}icense##');

            expect(fsWriteFileStub).to.not.have.been.called;
            expect(consoleErrorStub).to.not.have.been.called;
            expect(consoleLogStub).to.have.been.calledOnceWithExactly(sinon.match(/All files have licenses/));
        });

        it ('should insert licenses to those missing without using regex', () => {
            (licenseManager as any).mode = ManagementMode.INSERT;

            const insertStub = sandbox.stub(licenseManager as any, 'insertLicense');

            licenseManager.manage();

            expect_to_read_files();
            expect_to_format_license();
            expect(insertStub).to.have.been
                .calledOnceWithExactly('file without license', 'some license', 'some.txt', undefined);

            expect(fsWriteFileStub).to.not.have.been.called;
            expect(consoleErrorStub).to.not.have.been.called;
            expect(consoleLogStub).to.have.been.calledOnceWithExactly(sinon.match(/Inserted license into 1 file\(s\)/));
        });

        it ('should insert licenses to those missing using regex license template', () => {
            const replacementRegex = Object.assign(mockRegex, {replacement: 'some replacement'});

            licenseManager = new LicenseManager(
                ['some.txt', '.dotfile'], 'some ##l{1}icense##', mockFormats, DEFAULT_FORMAT,
                TrailingWhitespaceMode.DEFAULT, ManagementMode.CHECK, null, replacementRegex,
            );
            (licenseManager as any).mode = ManagementMode.INSERT;

            const insertStub = sandbox.stub(licenseManager as any, 'insertLicense');

            licenseManager.manage();

            expect_to_read_files();
            expect_to_format_license('some ##l{1}icense##');
            expect(insertStub).to.have.been
                .calledOnceWithExactly('file without license', 'some ##l{1}icense##', 'some.txt', replacementRegex);

            expect(fsWriteFileStub).to.not.have.been.called;
            expect(consoleErrorStub).to.not.have.been.called;
            expect(consoleLogStub).to.have.been.calledOnceWithExactly(sinon.match(/Inserted license into 1 file\(s\)/));
        });

        it ('should remove license from those with it', () => {
            (licenseManager as any).mode = ManagementMode.REMOVE;

            const removeStub = sandbox.stub(licenseManager as any, 'removeLicense');

            licenseManager.manage();

            expect_to_read_files();
            expect_to_format_license();
            expect(removeStub).to.have.been
                .calledOnceWithExactly('some license\nin the file', 'some license', '.dotfile');

            expect(fsWriteFileStub).to.not.have.been.called;
            expect(consoleErrorStub).to.not.have.been.called;
            expect(consoleLogStub).to.have.been.calledOnceWithExactly(sinon.match(/Removed license from 1 file\(s\)/));
        });

        it ('should remove license from those with it with regex license template', () => {
            licenseManager = new LicenseManager(
                ['some.txt', '.dotfile'], 'some ##l{1}icense##', mockFormats, DEFAULT_FORMAT,
                TrailingWhitespaceMode.DEFAULT, ManagementMode.CHECK, null, mockRegex,
            );
            (licenseManager as any).mode = ManagementMode.REMOVE;

            const removeStub = sandbox.stub(licenseManager as any, 'removeLicense');

            licenseManager.manage();

            expect_to_read_files();
            expect_to_format_license('some ##l{1}icense##');
            expect(removeStub).to.have.been
                .calledOnceWithExactly('some license\nin the file', 'some l{1}icense', '.dotfile');

            expect(fsWriteFileStub).to.not.have.been.called;
            expect(consoleErrorStub).to.not.have.been.called;
            expect(consoleLogStub).to.have.been.calledOnceWithExactly(sinon.match(/Removed license from 1 file\(s\)/));
        });

        it ('should write to output path when requested in check mode', () => {
            (licenseManager as any).mode = ManagementMode.CHECK;
            (licenseManager as any).outputPath = 'some output';

            expect(() => {
                licenseManager.manage();
            }).to.throw(/License check failed. 1 file/);

            expect(fsWriteFileStub).to.have.been.calledOnceWithExactly('some output', ['some.txt'].join(EOL));
        });

        it ('should write to output path when requested in insert mode', () => {
            (licenseManager as any).mode = ManagementMode.INSERT;
            (licenseManager as any).outputPath = 'some output';

            sandbox.stub(licenseManager as any, 'insertLicense');

            licenseManager.manage();

            expect(fsWriteFileStub).to.have.been.calledOnceWithExactly('some output', ['some.txt'].join(EOL));
        });

        it ('should write to output path when requested in remove mode', () => {
            (licenseManager as any).mode = ManagementMode.REMOVE;
            (licenseManager as any).outputPath = 'some output';

            sandbox.stub(licenseManager as any, 'removeLicense');

            licenseManager.manage();

            expect(fsWriteFileStub).to.have.been.calledOnceWithExactly('some output', ['.dotfile'].join(EOL));
        });

        it ('should store the license for an extension', () => {
            fsReadFileStub.onFirstCall().returns('some license');

            (licenseManager as any).mode = ManagementMode.CHECK;

            licenseManager.manage();

            const formattedLicenses = (licenseManager as any).formattedLicenses;

            expect(formattedLicenses).to.have.lengthOf(2);
            expect(formattedLicenses.has('.txt')).to.be.true;
            expect(formattedLicenses.has('.dotfile')).to.be.true;
            expect(formattedLicenses.get('.txt')).to.deep.equal({formatted: 'some license', normalised: 'some license'});
            expect(formattedLicenses.get('.dotfile')).to.deep.equal({formatted: 'some license', normalised: 'some license'});
        });

        it ('should use an existing stored license if the extension has already been handled', () => {
            fsReadFileStub.onFirstCall().returns('some license');

            (licenseManager as any).mode = ManagementMode.CHECK;

            (licenseManager as any).formattedLicenses = new Map<string, {formatted: string, normalised: string}>([
            [
                '.txt', {formatted: 'some license', normalised: 'some license'},
            ],
            [
                '.dotfile', {formatted: 'some license', normalised: 'some license'},
            ]]);

            licenseManager.manage();

            expect(mockLicenseFormatter.formatLicenseForFile.callCount).to.deep.equal(0);
        });
    });

    describe ('insertLicense', () => {
        let fsWriteFileStub: sinon.SinonStub;

        beforeEach (() => {
            mockLicenseFormatter.formatLicenseForFile.returns('some license');
            fsWriteFileStub = sandbox.stub();

            mockery.registerMock('fs-extra', { writeFileSync: fsWriteFileStub });

            delete require.cache[require.resolve('./license-manager')];
            LicenseManager = require('./license-manager').LicenseManager;

            licenseManager = new LicenseManager(
                ['some.txt', '.dotfile'], 'some license text', mockFormats, DEFAULT_FORMAT,
                TrailingWhitespaceMode.DEFAULT, ManagementMode.CHECK, 'some output path',
            );
        });

        it ('should write license to start of file when no shebang', () => {
            (licenseManager as any).insertLicense('some file contents', 'some license', 'some file');

            expect(fsWriteFileStub).to.have.been.calledWithExactly('some file', 'some license' + EOL + 'some file contents');
        });

        it ('should write license after shebang in file when shebang', () => {
            (licenseManager as any).insertLicense('#!ooh shebang\nsome file contents', 'some license', 'some file');

            expect(fsWriteFileStub).to.have.been.calledWithExactly(
                'some file', '#!ooh shebang' + EOL + 'some license' + EOL + 'some file contents',
            );
        });

        it ('should write license to start of file replacing the regex', () => {
            const replacementRegex = Object.assign(mockRegex, {replacement: 'replacement'});

            licenseManager = new LicenseManager(
                ['some.txt', '.dotfile'], 'some license text', mockFormats, DEFAULT_FORMAT,
                TrailingWhitespaceMode.DEFAULT, ManagementMode.CHECK, 'some output path', replacementRegex,
            );

            (licenseManager as any).insertLicense('some file contents', 'some ##l{1}icense##', 'some file', replacementRegex);

            expect(fsWriteFileStub).to.have.been.calledWithExactly('some file', 'some replacement' + EOL + 'some file contents');
        });
    });

    describe ('removeLicense', () => {
        let fsWriteFileStub: sinon.SinonStub;

        beforeEach (() => {
            mockLicenseFormatter.formatLicenseForFile.returns('some license');
            fsWriteFileStub = sandbox.stub();

            mockery.registerMock('fs-extra', { writeFileSync: fsWriteFileStub });

            delete require.cache[require.resolve('./license-manager')];
            LicenseManager = require('./license-manager').LicenseManager;

            licenseManager = new LicenseManager(
                ['some.txt', '.dotfile'], 'some license text', mockFormats, DEFAULT_FORMAT,
                TrailingWhitespaceMode.DEFAULT, ManagementMode.CHECK, 'some output path',
            );
        });

        it ('should do nothing when no license', () => {
            (licenseManager as any).removeLicense('some file contents', 'some license', 'some file');

            expect(fsWriteFileStub).to.not.have.been.called;
        });

        it ('should remove single line license when present', () => {
            (licenseManager as any).removeLicense('some license\nsome file contents', 'some license', 'some file');

            expect(fsWriteFileStub).to.have.been.calledWithExactly('some file', 'some file contents');
        });

        it ('should remove multi line license when present', () => {
            const multiLineLicense = 'some\nmulti line\nlicense';

            (licenseManager as any).removeLicense(multiLineLicense + '\nsome file contents', multiLineLicense, 'some file');

            expect(fsWriteFileStub).to.have.been.calledWithExactly('some file', 'some file contents');
        });

        it ('should handle when partial match of license is present and leave that but remove full license', () => {
            const multiLineLicense = 'some\nmulti line\nlicense';

            (licenseManager as any).removeLicense(
                'some\nmulti line\nlike license\n' + multiLineLicense + '\nsome file contents', multiLineLicense, 'some file',
            );

            expect(fsWriteFileStub).to.have.been.calledWithExactly('some file', 'some\nmulti line\nlike license\nsome file contents');
        });

        it ('should handle when regex is used in the license', () => {
            licenseManager = new LicenseManager(
                ['some.txt', '.dotfile'], 'some license text', mockFormats, DEFAULT_FORMAT,
                TrailingWhitespaceMode.DEFAULT, ManagementMode.CHECK, 'some output path', mockRegex,
            );

            (licenseManager as any).removeLicense('some license\nsome file contents', 'some l{1}icense', 'some file');

            expect(fsWriteFileStub).to.have.been.calledWithExactly('some file', 'some file contents');
        });
    });

    describe ('formatForCheck', () => {

        beforeEach(() => {
            licenseManager = new LicenseManager(
                ['some.txt', '.dotfile'], 'some license text', mockFormats, DEFAULT_FORMAT,
                TrailingWhitespaceMode.DEFAULT, ManagementMode.CHECK, 'some output path',
            );
        });

        it ('should normalise line endings and trim whitespace', () => {
            const multiLineLicense = 'some\r\nmulti line   \r\nlicense ';

            const formatted = (licenseManager as any).formatForCheck(multiLineLicense);

            expect(formatted).to.deep.equal('some\nmulti line\nlicense');
        });

        it ('should normalise line endings and leave whitespace', () => {
            (licenseManager as any).trailingWhitespace = TrailingWhitespaceMode.TRIM;

            const multiLineLicense = 'some\r\nmulti line   \r\nlicense ';

            const formatted = (licenseManager as any).formatForCheck(multiLineLicense);

            expect(formatted).to.deep.equal('some\nmulti line   \nlicense ');
        });

        it ('should throw an error when regex identifier is not closed', () => {
            const multiLineLicense = 'some\r\n##multi line   \r\n##l{1}cense## with bad regex identifying';

            expect(() => {
                (licenseManager as any).formatForCheck(multiLineLicense, mockRegex);
            }).to.throw('Odd number of regex identifiers found. One must be missing its close');
        });

        it ('should normalise and handle regex', () => {
            const multiLineLicense = 'some\r\nmulti line   \r\n##l{1}cense## with regex ';

            const formatted = (licenseManager as any).formatForCheck(multiLineLicense, mockRegex);

            expect(formatted).to.deep.equal('some\nmulti line\nl{1}cense with regex');
        });

        it ('should normalise and handle regex when regex and escape characters in non regex', () => {
            const multiLineLicense = 'some\r\nmulti line (ooh bracket)  \r\n##l{1}cense## with regex ';

            const formatted = (licenseManager as any).formatForCheck(multiLineLicense, mockRegex);

            expect(formatted).to.deep.equal('some\nmulti line \\(ooh bracket\\)\nl{1}cense with regex');
        });
    });
});
