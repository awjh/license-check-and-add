
import * as chai from 'chai';
import * as mockery from 'mockery';
import { EOL } from 'os';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { DEFAULT_FORMAT } from '../constants';
import { TrailingWhitespaceMode } from './config-parser';
import { IFormatCollection, LicenseFormatter } from './license-formatter';
import { LicenseManager, ManagementMode } from './license-manager';

const expect = chai.expect;
chai.use(sinonChai);

// tslint:disable: no-unused-expression

describe ('LicenseManager', () => {

    let sandbox: sinon.SinonSandbox;

    let MockeryLicenseManager;

    let LicenseFormatterStub: sinon.SinonStub;
    let mockLicenseFormatter: sinon.SinonStubbedInstance<LicenseFormatter>;

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
        MockeryLicenseManager = require('./license-manager').LicenseManager;
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
            const lm: LicenseManager = new MockeryLicenseManager(
                ['some', 'paths'], 'some license text', null, DEFAULT_FORMAT,
                TrailingWhitespaceMode.TRIM, ManagementMode.CHECK, 'some output path',
            );

            expect(lm.paths).to.deep.equal(['some', 'paths']);
            expect(LicenseFormatterStub).to.have.been.calledOnceWithExactly(DEFAULT_FORMAT, TrailingWhitespaceMode.TRIM);
            expect(lm.licenseFormatter).to.deep.equal(mockLicenseFormatter);
            expect(lm.mode).to.deep.equal(ManagementMode.CHECK);
            expect(lm.outputPath).to.deep.equal('some output path');
        });

        it ('should configure with a license formatter that has declared formats', () => {
            const lm: LicenseManager = new MockeryLicenseManager(
                ['some', 'paths'], 'some license text', mockFormats, DEFAULT_FORMAT,
                TrailingWhitespaceMode.DEFAULT, ManagementMode.INSERT, 'some output path',
            );

            expect(lm.paths).to.deep.equal(['some', 'paths']);
            expect(LicenseFormatterStub).to.have.been.calledOnceWithExactly(DEFAULT_FORMAT, TrailingWhitespaceMode.DEFAULT, mockFormats);
            expect(lm.licenseFormatter).to.deep.equal(mockLicenseFormatter);
            expect(lm.mode).to.deep.equal(ManagementMode.INSERT);
            expect(lm.outputPath).to.deep.equal('some output path');
        });
    });

    describe('manage', () => {
        let fsReadFileStub: sinon.SinonStub;
        let fsWriteFileStub: sinon.SinonStub;
        let consoleLogStub: sinon.SinonStub;
        let consoleErrorStub: sinon.SinonStub;

        let lm: LicenseManager;

        beforeEach (() => {
            mockLicenseFormatter.formatLicenseForFile.returns('some license');
            fsReadFileStub = sandbox.stub().onFirstCall().returns('file without license')
                .onSecondCall().returns('some license\nin the file');
            fsWriteFileStub = sandbox.stub();
            consoleLogStub = sandbox.stub(console, 'log');
            consoleErrorStub = sandbox.stub(console, 'error');

            mockery.registerMock('fs-extra', { readFileSync: fsReadFileStub, writeFileSync: fsWriteFileStub });

            delete require.cache[require.resolve('./license-manager')];
            MockeryLicenseManager = require('./license-manager').LicenseManager;

            lm = new MockeryLicenseManager(
                ['some.txt', '.dotfile'], 'some license text', mockFormats, DEFAULT_FORMAT,
                TrailingWhitespaceMode.DEFAULT, ManagementMode.CHECK,
            );
        });

        function expect_to_read_files () {
            expect(fsReadFileStub.callCount).to.deep.equal(2);
            expect(fsReadFileStub).to.have.been.calledWithExactly('some.txt');
            expect(fsReadFileStub).to.have.been.calledWithExactly('.dotfile');
        }

        function expect_to_format_license () {
            expect(mockLicenseFormatter.formatLicenseForFile.callCount).to.deep.equal(2);
            expect(mockLicenseFormatter.formatLicenseForFile).to.have.been.calledWithExactly('.txt', 'some license text');
            expect(mockLicenseFormatter.formatLicenseForFile).to.have.been.calledWithExactly('.dotfile', 'some license text');
        }

        it ('should throw an error when missing licenses in check mode', () => {
            (lm as any).mode = ManagementMode.CHECK;

            expect(() => {
                lm.manage();
            }).to.throw(/License check failed. 1 file/);

            expect_to_read_files();
            expect_to_format_license();

            expect(fsWriteFileStub).to.not.have.been.called;
            expect(consoleLogStub).to.not.have.been.called;
            expect(consoleErrorStub).to.have.been.calledOnceWithExactly(sinon.match(/License not found in/), 'some.txt');
        });

        it ('should not throw an error when all files have license in check mode', () => {
            fsReadFileStub.onFirstCall().returns('some license');

            (lm as any).mode = ManagementMode.CHECK;

            lm.manage();

            expect_to_read_files();
            expect_to_format_license();

            expect(fsWriteFileStub).to.not.have.been.called;
            expect(consoleErrorStub).to.not.have.been.called;
            expect(consoleLogStub).to.have.been.calledOnceWithExactly(sinon.match(/All files have licenses/));
        });

        it ('should insert licenses to those missing', () => {
            (lm as any).mode = ManagementMode.INSERT;

            const insertStub = sandbox.stub(lm as any, 'insertLicense');

            lm.manage();

            expect_to_read_files();
            expect_to_format_license();
            expect(insertStub).to.have.been
                .calledOnceWithExactly('file without license', 'some license', 'some.txt');

            expect(fsWriteFileStub).to.not.have.been.called;
            expect(consoleErrorStub).to.not.have.been.called;
            expect(consoleLogStub).to.have.been.calledOnceWithExactly(sinon.match(/Inserted license into 1 file\(s\)/));
        });

        it ('should remove license from those with it', () => {
            (lm as any).mode = ManagementMode.REMOVE;

            const removeStub = sandbox.stub(lm as any, 'removeLicense');

            lm.manage();

            expect_to_read_files();
            expect_to_format_license();
            expect(removeStub).to.have.been
                .calledOnceWithExactly('some license\nin the file', 'some license', '.dotfile');

            expect(fsWriteFileStub).to.not.have.been.called;
            expect(consoleErrorStub).to.not.have.been.called;
            expect(consoleLogStub).to.have.been.calledOnceWithExactly(sinon.match(/Removed license from 1 file\(s\)/));
        });

        it ('should write to output path when requested in check mode', () => {
            (lm as any).mode = ManagementMode.CHECK;
            (lm as any).outputPath = 'some output';

            expect(() => {
                lm.manage();
            }).to.throw(/License check failed. 1 file/);

            expect(fsWriteFileStub).to.have.been.calledOnceWithExactly('some output', ['some.txt'].join(EOL));
        });

        it ('should write to output path when requested in insert mode', () => {
            (lm as any).mode = ManagementMode.INSERT;
            (lm as any).outputPath = 'some output';

            sandbox.stub(lm as any, 'insertLicense');

            lm.manage();

            expect(fsWriteFileStub).to.have.been.calledOnceWithExactly('some output', ['some.txt'].join(EOL));
        });

        it ('should write to output path when requested in remove mode', () => {
            (lm as any).mode = ManagementMode.REMOVE;
            (lm as any).outputPath = 'some output';

            sandbox.stub(lm as any, 'removeLicense');

            lm.manage();

            expect(fsWriteFileStub).to.have.been.calledOnceWithExactly('some output', ['.dotfile'].join(EOL));
        });
    });

    describe ('insertLicense', () => {
        let fsWriteFileStub: sinon.SinonStub;

        let lm: LicenseManager;

        beforeEach (() => {
            mockLicenseFormatter.formatLicenseForFile.returns('some license');
            fsWriteFileStub = sandbox.stub();

            mockery.registerMock('fs-extra', { writeFileSync: fsWriteFileStub });

            delete require.cache[require.resolve('./license-manager')];
            MockeryLicenseManager = require('./license-manager').LicenseManager;

            lm = new MockeryLicenseManager(
                ['some.txt', '.dotfile'], 'some license text', mockFormats, DEFAULT_FORMAT,
                TrailingWhitespaceMode.DEFAULT, ManagementMode.CHECK,
            );
        });

        it ('should write license to start of file when no shebang', () => {
            (lm as any).insertLicense('some file contents', 'some license', 'some file');

            expect(fsWriteFileStub).to.have.been.calledWithExactly('some file', 'some license' + EOL + 'some file contents');
        });

        it ('should write license after shebang in file when shebang', () => {
            (lm as any).insertLicense('#!ooh shebang\nsome file contents', 'some license', 'some file');

            expect(fsWriteFileStub).to.have.been.calledWithExactly(
                'some file', '#!ooh shebang' + EOL + 'some license' + EOL + 'some file contents',
            );
        });
    });

    describe ('removeLicense', () => {
        let fsWriteFileStub: sinon.SinonStub;

        let lm: LicenseManager;

        beforeEach (() => {
            mockLicenseFormatter.formatLicenseForFile.returns('some license');
            fsWriteFileStub = sandbox.stub();

            mockery.registerMock('fs-extra', { writeFileSync: fsWriteFileStub });

            delete require.cache[require.resolve('./license-manager')];
            MockeryLicenseManager = require('./license-manager').LicenseManager;

            lm = new MockeryLicenseManager(
                ['some.txt', '.dotfile'], 'some license text', mockFormats, DEFAULT_FORMAT,
                TrailingWhitespaceMode.DEFAULT, ManagementMode.CHECK,
            );
        });

        it ('should do nothing when no license', () => {
            (lm as any).removeLicense('some file contents', 'some license', 'some file');

            expect(fsWriteFileStub).to.not.have.been.called;
        });

        it ('should remove single line license when present', () => {
            (lm as any).removeLicense('some license\nsome file contents', 'some license', 'some file');

            expect(fsWriteFileStub).to.have.been.calledWithExactly('some file', 'some file contents');
        });

        it ('should remove multi line license when present', () => {
            const multiLineLicense = 'some\nmulti line\nlicense';

            (lm as any).removeLicense(multiLineLicense + '\nsome file contents', multiLineLicense, 'some file');

            expect(fsWriteFileStub).to.have.been.calledWithExactly('some file', 'some file contents');
        });

        it ('should handle when partial match of license is present', () => {
            const multiLineLicense = 'some\nmulti line\nlicense';

            (lm as any).removeLicense(
                'some\nmulti line\nlike license\n' + multiLineLicense + '\nsome file contents', multiLineLicense, 'some file',
            );

            expect(fsWriteFileStub).to.have.been.calledWithExactly('some file', 'some\nmulti line\nlike license\nsome file contents');
        });
    });
});
