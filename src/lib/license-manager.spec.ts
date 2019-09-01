
import * as chai from 'chai';
import * as mockery from 'mockery';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { DEFAULT_FORMAT } from '../constants';
import { TrailingWhitespaceMode } from './config-parser';
import { IFormatCollection, LicenseFormatter } from './license-formatter';
import { LicenseManager, ManagementMode } from './license-manager';

const expect = chai.expect;
chai.use(sinonChai);

describe ('LicenseManager', () => {

    let sandbox: sinon.SinonSandbox;

    let MockeryLicenseManager;

    let LicenseFormatterStub: sinon.SinonStub;
    let mockLicenseFormatter: sinon.SinonStubbedInstance<LicenseFormatter>;

    before(() => {
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false,
        });
    });

    beforeEach(() => {
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
});
