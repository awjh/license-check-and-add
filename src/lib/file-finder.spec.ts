import * as chai from 'chai';
import * as mockery from 'mockery';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { DEFAULT_IGNORES } from './file-finder';

const expect = chai.expect;
chai.use(sinonChai);

describe ('#FileFinder', () => {

    let sandbox: sinon.SinonSandbox;
    let globbySyncStub: sinon.SinonStub;

    const ignoreInput = ['should', 'ignore'];

    const mockValidPaths = ['some', 'valid', 'paths'];

    const globbyConfig = {
        dot: true,
        expandDirectories: true,
    };

    let getPaths;

    before (() => {
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false,
        });
    });

    beforeEach (() => {
        sandbox = sinon.createSandbox();

        globbySyncStub = sandbox.stub().returns(mockValidPaths);

        mockery.registerMock('globby', {sync: globbySyncStub});

        delete require.cache[require.resolve('./file-finder')];
        getPaths = require('./file-finder').getPaths;
    });

    afterEach(() => {
        sandbox.restore();
        mockery.deregisterAll();
    });

    after(() => {
        mockery.disable();
    });

    it ('should return the list of files from globby filtered by ignore list passed', () => {
        const paths = getPaths(ignoreInput, true);

        expect(paths).to.deep.equal(mockValidPaths);
        expect(globbySyncStub).to.have.been.calledOnceWithExactly('**/*', Object.assign(globbyConfig, {ignore: ignoreInput}));
    });

    it ('should return the list of files from globby filtered by ignore list passed and default ignore', () => {
        const paths = getPaths(ignoreInput, false);

        expect(paths).to.deep.equal(mockValidPaths);
        expect(globbySyncStub).to.have.been.calledOnceWithExactly(
            '**/*', Object.assign(globbyConfig, {ignore: ignoreInput.concat(DEFAULT_IGNORES)}),
        );
    });
});
