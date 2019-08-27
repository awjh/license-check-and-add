import * as chai from 'chai';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { DEFAULT_FORMATS } from '../constants';
import { TrailingWhitespaceMode } from './config-parser';
import { IFormatCollection, ILicenseFormat, LicenseFormatter } from './license-formatter';

const expect = chai.expect;
chai.use(sinonChai);

describe ('#LicenseFormatter', () => {
    const mockDefaultFormat: ILicenseFormat = {
        append: 'DEFAULT ',
        prepend: 'DEFAULT ',
    };

    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
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
        };

        let separateStub: sinon.SinonStub;

        beforeEach(() => {
            separateStub = sandbox.stub(LicenseFormatter.prototype as any, 'separateFileTypesInFormat').onFirstCall().returns(mockFormats);
        });

        it ('should configure all values and set default formats as the license formats', () => {
            const lf: LicenseFormatter = new LicenseFormatter(mockDefaultFormat, TrailingWhitespaceMode.TRIM);

            expect(separateStub.callCount).to.equal(1);
            expect(separateStub).to.have.been.calledOnceWithExactly(DEFAULT_FORMATS);
            expect(lf.defaultFormat).to.deep.equal(mockDefaultFormat);
            expect(lf.stripTrailingWhitespace).to.equal(true);
            expect(lf.licenseFormats).to.deep.equal(mockFormats);
        });

        it ('should configure all values and set default formats as the license formats combined with passed formats', () => {
            const declaredFormats = {
                html: {
                    append: '-->',
                    prepend: '<!--',
                },
                js: {
                    eachLine: {
                        prepend: '// ',
                    },
                },
            };

            separateStub.onSecondCall().returns(declaredFormats);

            const lf: LicenseFormatter = new LicenseFormatter(mockDefaultFormat, TrailingWhitespaceMode.TRIM, declaredFormats);

            expect(separateStub.callCount).to.equal(2);
            expect(separateStub.getCall(0).args).to.deep.equal([DEFAULT_FORMATS]);
            expect(separateStub.getCall(1).args).to.deep.equal([declaredFormats]);
            expect(lf.defaultFormat).to.deep.equal(mockDefaultFormat);
            expect(lf.stripTrailingWhitespace).to.equal(true);
            expect(lf.licenseFormats).to.deep.equal(Object.assign(mockFormats, declaredFormats));
            expect(lf.licenseFormats.js).to.deep.equal(declaredFormats.js);
        });
    });

    describe ('formatLicenseForFile', () => {

    });
});
