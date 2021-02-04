import * as chai from 'chai';
import * as mockery from 'mockery';
import * as path from 'path';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { DEFAULT_IGNORES, FileFinder as FileFinderDef } from './file-finder';

const expect = chai.expect;
chai.use(sinonChai);

describe ('#FileFinder', () => {

    let sandbox: sinon.SinonSandbox;
    let globbySyncStub: sinon.SinonStub;
    let gitignoreToGlobStub: sinon.SinonStub;
    let FileFinder: typeof FileFinderDef;

    const ignoreInput = ['should', 'ignore'];

    const mockValidPaths = ['some', 'valid', 'paths'];

    const globbyConfig = {
        dot: true,
        expandDirectories: true,
    };

    before (() => {
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false,
        });
    });

    beforeEach (() => {
        sandbox = sinon.createSandbox();

        globbySyncStub = sandbox.stub().returns(mockValidPaths);
        gitignoreToGlobStub = sandbox.stub().returns(['some', 'ignore', 'values']);

        mockery.registerMock('globby', {sync: globbySyncStub});
        mockery.registerMock('gitignore-to-glob', gitignoreToGlobStub);

        delete require.cache[require.resolve('./file-finder')];
        FileFinder = require('./file-finder').FileFinder;
    });

    afterEach(() => {
        sandbox.restore();
        mockery.deregisterAll();
    });

    after(() => {
        mockery.disable();
    });

    it ('should return the list of files from globby filtered by ignore list passed', () => {
        const paths = FileFinder.getPaths(ignoreInput, true);

        expect(paths).to.deep.equal(mockValidPaths);
        expect(globbySyncStub).to.have.been.calledOnceWithExactly(['**/*'], Object.assign(globbyConfig, {ignore: ignoreInput}));
    });

    it ('should return the list of files from globby filtered by ignore list passed and default ignore', () => {
        const paths = FileFinder.getPaths(ignoreInput, false);

        expect(paths).to.deep.equal(mockValidPaths);
        expect(globbySyncStub).to.have.been.calledOnceWithExactly(
            ['**/*'], Object.assign(globbyConfig, {ignore: ignoreInput.concat(DEFAULT_IGNORES)}),
        );
    });

    it ('should return the list of file from globby filtered by ignore file passed and default ignores', () => {
        const paths = FileFinder.getPaths('some/file/path', false);

        expect(paths).to.deep.equal(mockValidPaths);
        expect(globbySyncStub).to.have.been.calledOnceWithExactly(
            ['**/*', 'some', 'ignore', 'values', '!some/file/path'], Object.assign(globbyConfig, {ignore: DEFAULT_IGNORES}),
        );
        expect(gitignoreToGlobStub).to.have.been.calledOnceWithExactly(path.resolve(process.cwd(), 'some/file/path'));
    });
});
