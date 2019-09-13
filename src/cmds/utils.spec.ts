import * as chai from 'chai';
import * as mockery from 'mockery';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';

const expect = chai.expect;
chai.use(sinonChai);

describe ('CommandUtils', () => {
    let sandbox: sinon.SinonSandbox;

    let getPathsStub: sinon.SinonStub;
    let configParserStub: sinon.SinonStub;

    let MockUtils;

    before(() => {
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false,
        });
    });

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        getPathsStub = sandbox.stub();
        configParserStub = sandbox.stub();

        mockery.registerMock('../lib/file-finder', { getPaths: getPathsStub });
        mockery.registerMock('../lib/config-parser', { configParser: configParserStub });

        delete require.cache[require.resolve('./utils.ts')];
        MockUtils = require('./utils.ts');
    });
});
