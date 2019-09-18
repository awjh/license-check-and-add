import * as chai from 'chai';
import * as mockery from 'mockery';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { OPTIONS } from '../constants';
import { ManagementMode } from '../lib/license-manager';
import { addExports } from './utils';

const expect = chai.expect;
chai.use(sinonChai);

describe ('#RemoveCommand', () => {

    let sandbox: sinon.SinonSandbox;

    let manageLicenseStub: sinon.SinonStub;

    let MockeryRemoveCommand;

    before(() => {
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false,
        });
    });

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        manageLicenseStub = sandbox.stub();

        mockery.registerMock('./utils', { manageLicense: manageLicenseStub, addExports });

        delete require.cache[require.resolve('./remove.ts')];
        MockeryRemoveCommand = require('./remove.ts');
    });

    describe ('builder', () => {
        it ('should configure yargs', () => {
            const yargs = {
                options: sinon.stub(),
                usage: sinon.stub(),
            };

            const returned = MockeryRemoveCommand.builder(yargs);

            expect(returned).to.deep.equal(yargs);
            expect(yargs.options).to.have.been.calledOnceWithExactly(OPTIONS);
            expect(yargs.usage).to.have.been.calledOnceWithExactly('license-check-and-add remove');
        });
    });

    describe ('handler', () => {
        it ('should manage license', () => {
            MockeryRemoveCommand.handler('some args');

            expect(manageLicenseStub).to.have.been.calledOnceWithExactly('some args', ManagementMode.REMOVE);
        });
    });
});
