import * as chai from 'chai';
import * as fs from 'fs-extra';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { configParser, IInputConfig } from './config-parser';

const expect = chai.expect;
chai.use(sinonChai);

describe ('#ConfigParser', () => {

    let sandbox: sinon.SinonSandbox;
    let fsReadStub: sinon.SinonStub;

    let mockConfig: IInputConfig;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        mockConfig = {
            ignore: './.gitignore',
            license: 'LICENSE.txt',
        };

        fsReadStub = sandbox.stub(fs, 'readJSONSync').returns(mockConfig);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it ('should throw an error when missing ignore from input JSON', () => {
        delete mockConfig.ignore;

        expect(() => {
            configParser('some/file/path');
        }).to.throw('Missing required field in config: ignore');
    });
});
