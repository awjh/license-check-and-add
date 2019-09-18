import * as chai from 'chai';
import * as mockery from 'mockery';
import * as path from 'path';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { CONFIG_OPTION } from '../constants';
import { LicenseManager, ManagementMode } from '../lib/license-manager';

const expect = chai.expect;
chai.use(sinonChai);

describe ('#CommandUtils', () => {
    let sandbox: sinon.SinonSandbox;

    let getPathsStub: sinon.SinonStub;
    let configParserStub: sinon.SinonStub;
    let LicenseManagerStub: sinon.SinonStub;
    let mockLicenseManager: sinon.SinonStubbedInstance<LicenseManager>;

    let MockUtils;

    const mockConfig = {
        defaultFormat: 'some format',
        ignore: ['some', 'stuff', 'to', 'ignore'],
        ignoreDefaultIgnores: 'ignore default',
        license: 'some license',
        licenseFormats: 'some formats',
        output: 'some outpu',
        trailingWhitespace: 'trail the whitespace',
    };

    before (() => {
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false,
        });
    });

    beforeEach (() => {
        sandbox = sinon.createSandbox();
        getPathsStub = sandbox.stub().returns('some paths');
        configParserStub = sandbox.stub().returns(mockConfig);
        mockLicenseManager = sandbox.createStubInstance(LicenseManager);
        LicenseManagerStub = sandbox.stub().returns(mockLicenseManager);

        mockery.registerMock('../lib/file-finder', { getPaths: getPathsStub });
        mockery.registerMock('../lib/config-parser', { configParser: configParserStub });
        mockery.registerMock('../lib/license-manager', { LicenseManager: LicenseManagerStub });

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

            MockUtils.manageLicense(mockArgs, ManagementMode.CHECK);

            expect(configParserStub).to.have.been.calledOnceWithExactly(path.resolve(process.cwd(), 'some config file'));
            expect(getPathsStub).to.have.been.calledOnceWithExactly(mockConfig.ignore, mockConfig.ignoreDefaultIgnores);
            expect(LicenseManagerStub).to.have.been.calledOnceWithExactly(
                'some paths', mockConfig.license, mockConfig.licenseFormats, mockConfig.defaultFormat,
                mockConfig.trailingWhitespace, ManagementMode.CHECK, mockConfig.output,
            );
            expect(mockLicenseManager.manage).to.have.been.calledOnceWithExactly();
        });
    });
});
