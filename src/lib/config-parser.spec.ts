import * as chai from 'chai';
import * as mockery from 'mockery';
import * as path from 'path';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { DEFAULT_FORMAT } from '../constants';
import { IConfig, IInputConfig, TrailingWhitespaceMode } from './config-parser';

const expect = chai.expect;
chai.use(sinonChai);

describe ('#ConfigParser', () => {

    let sandbox: sinon.SinonSandbox;
    let fsReadJSONStub: sinon.SinonStub;
    let fsReadFileStub: sinon.SinonStub;

    let mockConfig: IInputConfig;

    let configParser;

    before (() => {
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false,
        });
    });

    beforeEach (() => {
        sandbox = sinon.createSandbox();

        mockConfig = {
            license: 'LICENSE.txt',
        };

        fsReadJSONStub = sandbox.stub().returns(mockConfig);
        fsReadFileStub = sandbox.stub().returns('some license');

        mockery.registerMock('fs-extra', { readJSONSync: fsReadJSONStub, readFileSync: fsReadFileStub });

        delete require.cache[require.resolve('./config-parser')];
        configParser = require('./config-parser').configParser;
    });

    afterEach(() => {
        sandbox.restore();
        mockery.deregisterAll();
    });

    after(() => {
        mockery.disable();
    });

    it ('should throw an error when missing license from input JSON', () => {
        delete mockConfig.license;

        expect(() => {
            configParser('some/file/path');
        }).to.throw('Missing required field in config: license');
        expect(fsReadJSONStub).to.have.been.calledOnceWithExactly('some/file/path');
    });

    it ('should handle when minimum required fields are passed', () => {
        const config = configParser('some/file/path');

        expect(config).deep.equal({
            defaultFormat: DEFAULT_FORMAT,
            ignore: [],
            ignoreDefaultIgnores: false,
            license: 'some license',
            licenseFormats: {},
            trailingWhitespace: TrailingWhitespaceMode.DEFAULT,
        } as IConfig);
        expect(fsReadJSONStub).to.have.been.calledOnceWithExactly('some/file/path');
        expect(fsReadFileStub).to.have.been.calledOnceWithExactly(path.resolve(process.cwd(), 'LICENSE.txt'));
    });

    it ('should handle when ignore is an array', () => {
        mockConfig.ignore = ['**/*.js', '**/*.html'];

        const config = configParser('some/file/path');

        expect(config).deep.equal({
            defaultFormat: DEFAULT_FORMAT,
            ignore: mockConfig.ignore,
            ignoreDefaultIgnores: false,
            license: 'some license',
            licenseFormats: {},
            trailingWhitespace: TrailingWhitespaceMode.DEFAULT,
        } as IConfig);
        expect(fsReadJSONStub).to.have.been.calledOnceWithExactly('some/file/path');
        expect(fsReadFileStub).to.have.been.calledOnceWithExactly(path.resolve(process.cwd(), 'LICENSE.txt'));
    });

    it ('should handle when ignore is a file', () => {
        mockConfig.ignore = 'some/ignore/file';

        const config = configParser('some/file/path');

        expect(config).deep.equal({
            defaultFormat: DEFAULT_FORMAT,
            ignore: 'some/ignore/file',
            ignoreDefaultIgnores: false,
            license: 'some license',
            licenseFormats: {},
            trailingWhitespace: TrailingWhitespaceMode.DEFAULT,
        } as IConfig);

        expect(fsReadJSONStub).to.have.been.calledOnceWithExactly('some/file/path');
        expect(fsReadFileStub).to.have.been.calledOnceWithExactly(path.resolve(process.cwd(), 'LICENSE.txt'));
    });

    it ('should use specified default format', () => {
        mockConfig.defaultFormat = {
            append: '###',
            prepend: '###',
        };

        const config = configParser('some/file/path');

        expect(config).deep.equal({
            defaultFormat: mockConfig.defaultFormat,
            ignore: [],
            ignoreDefaultIgnores: false,
            license: 'some license',
            licenseFormats: {},
            trailingWhitespace: TrailingWhitespaceMode.DEFAULT,
        } as IConfig);
        expect(fsReadJSONStub).to.have.been.calledOnceWithExactly('some/file/path');
        expect(fsReadFileStub).to.have.been.calledOnceWithExactly(path.resolve(process.cwd(), 'LICENSE.txt'));
    });

    it ('should handle when trailing whitespace set but not to trim', () => {
        (mockConfig as any).trailingWhitespace = 'NOT trim';

        const config = configParser('some/file/path');

        expect(config).deep.equal({
            defaultFormat: DEFAULT_FORMAT,
            ignore: [],
            ignoreDefaultIgnores: false,
            license: 'some license',
            licenseFormats: {},
            trailingWhitespace: TrailingWhitespaceMode.DEFAULT,
        } as IConfig);
        expect(fsReadJSONStub).to.have.been.calledOnceWithExactly('some/file/path');
        expect(fsReadFileStub).to.have.been.calledOnceWithExactly(path.resolve(process.cwd(), 'LICENSE.txt'));
    });

    it ('should handle when trailing whitespace set to trim', () => {
        (mockConfig as any).trailingWhitespace = 'trIm';

        const config = configParser('some/file/path');

        expect(config).deep.equal({
            defaultFormat: DEFAULT_FORMAT,
            ignore: [],
            ignoreDefaultIgnores: false,
            license: 'some license',
            licenseFormats: {},
            trailingWhitespace: TrailingWhitespaceMode.TRIM,
        } as IConfig);
        expect(fsReadJSONStub).to.have.been.calledOnceWithExactly('some/file/path');
        expect(fsReadFileStub).to.have.been.calledOnceWithExactly(path.resolve(process.cwd(), 'LICENSE.txt'));
    });

    it ('should handle when output specified', () => {
        mockConfig.output = 'some/output/path';

        const config = configParser('some/file/path');

        expect(config).deep.equal({
            defaultFormat: DEFAULT_FORMAT,
            ignore: [],
            ignoreDefaultIgnores: false,
            license: 'some license',
            licenseFormats: {},
            output: path.resolve(process.cwd(), 'some/output/path'),
            trailingWhitespace: TrailingWhitespaceMode.DEFAULT,
        } as IConfig);
        expect(fsReadJSONStub).to.have.been.calledOnceWithExactly('some/file/path');
        expect(fsReadFileStub).to.have.been.calledOnceWithExactly(path.resolve(process.cwd(), 'LICENSE.txt'));
    });
});
