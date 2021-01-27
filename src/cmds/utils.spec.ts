import * as chai from 'chai';
import * as mockery from 'mockery';
import * as path from 'path';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { CONFIG_OPTION, DEFAULT_FORMAT, REGEX_OPTION } from '../constants';
import { ConfigParser, IConfig, TrailingWhitespaceMode } from '../lib/config-parser';
import { FileFinder } from '../lib/file-finder';
import { LicenseManager, ManagementMode } from '../lib/license-manager';

const expect = chai.expect;
chai.use(sinonChai);

describe ('#CommandUtils', () => {
    let sandbox: sinon.SinonSandbox;

    let getPathsStub: sinon.SinonStub;
    let LicenseManagerStub: sinon.SinonStub;
    let mockLicenseManager: sinon.SinonStubbedInstance<LicenseManager>;

    let configParserStub: sinon.SinonStub;

    let MockUtils;

    const mockConfig: IConfig = {
        defaultFormat: DEFAULT_FORMAT,
        ignore: ['some', 'stuff', 'to', 'ignore'],
        ignoreDefaultIgnores: true,
        license: 'some license',
        licenseFormats: {},
        trailingWhitespace: TrailingWhitespaceMode.DEFAULT,
    };

    before (() => {
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false,
        });
    });

    beforeEach (() => {
        sandbox = sinon.createSandbox();
        mockLicenseManager = sandbox.createStubInstance(LicenseManager);
        LicenseManagerStub = sandbox.stub().returns(mockLicenseManager);

        mockery.registerMock('../lib/license-manager', { LicenseManager: LicenseManagerStub });

        configParserStub = sandbox.stub(ConfigParser, 'parse').returns(mockConfig);
        getPathsStub = sandbox.stub(FileFinder, 'getPaths').returns(['some paths']);

        delete require.cache[require.resolve('./utils.ts')];
        MockUtils = require('./utils.ts');
    });

    afterEach(() => {
        sandbox.restore();
        mockery.deregisterAll();
    });

    after(() => {
        mockery.disable();
    });

    describe ('addExports', () => {
        it ('should add to exports', () => {
            const mockExports = {};
            const mockCommandModule = {
                aliases: 'some alias',
                builder: 'some builder',
                command: 'some command',
                describe: 'some description',
                helper: 'some helper',
            };

            MockUtils.addExports(mockExports, mockCommandModule);

            expect(mockExports).to.deep.equal(mockCommandModule);
        });
    });

    describe ('manageLicense', () => {
        it ('should setup license manager and manage', () => {
            const mockArgs = {};
            mockArgs[CONFIG_OPTION] = 'some config file';
            mockArgs[REGEX_OPTION] = 'some regex option';

            const expectedConfigPath = path.resolve(process.cwd(), 'some config file');

            MockUtils.manageLicense(mockArgs, ManagementMode.CHECK);

            expect(configParserStub).to.have.been.calledOnceWithExactly(expectedConfigPath, ManagementMode.CHECK, 'some regex option');
            expect(getPathsStub).to.have.been.calledOnceWithExactly(mockConfig.ignore, mockConfig.ignoreDefaultIgnores);
            expect(LicenseManagerStub).to.have.been.calledOnceWithExactly(
                ['some paths'], mockConfig.license, mockConfig.licenseFormats, mockConfig.defaultFormat,
                mockConfig.trailingWhitespace, ManagementMode.CHECK, mockConfig.output,
            );
            expect(mockLicenseManager.manage).to.have.been.calledOnceWithExactly();
        });
    });
});
