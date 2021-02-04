import * as chai from 'chai';
import * as fs from 'fs-extra';
import * as mockery from 'mockery';
import { EOL } from 'os';
import * as path from 'path';
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

    let sandbox: sinon.SinonSandbox;
    let separateStub: sinon.SinonStub;

    beforeEach (() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe ('constructor', () => {

        beforeEach (() => {
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

        beforeEach (() => {
            separateStub = sandbox.stub(LicenseFormatter.prototype as any, 'separateFileTypesInFormat').onFirstCall().returns(mockFormats);
        });

        const mockLicenseText = fs.readFileSync(path.resolve(__dirname, '../../test/non-regex/original-files/LICENSE'), 'utf-8');

        it ('should use an already formatted license file when one specified', () => {
            mockery.enable({
                warnOnReplace: false,
                warnOnUnregistered: false,
            });

            const fsReadFileStub = sandbox.stub().returns('some license');

            mockery.registerMock('fs-extra', { readFileSync: fsReadFileStub });

            delete require.cache[require.resolve('./license-formatter')];
            const mockeriedLicenseFormatter = require('./license-formatter').LicenseFormatter;
            separateStub = sandbox.stub(mockeriedLicenseFormatter.prototype as any, 'separateFileTypesInFormat').onFirstCall()
                .returns(mockFormats);

            const lf: LicenseFormatter = new mockeriedLicenseFormatter(mockDefaultFormat, TrailingWhitespaceMode.TRIM);
            (lf as any).defaultFormat = {
                file: 'some file',
            };

            const formatted = lf.formatLicenseForFile('ext', mockLicenseText);

            expect(formatted).to.deep.equal('some license');

            mockery.disable();
            delete require.cache[require.resolve('./license-formatter')];
        });

        it ('should prepend a license', () => {
            const testDefaultFormat: ILicenseFormat = {
                prepend: '###',
            };

            const lf: LicenseFormatter = new LicenseFormatter(testDefaultFormat, TrailingWhitespaceMode.DEFAULT);

            const formatted = lf.formatLicenseForFile('ext', mockLicenseText);

            expect(formatted).to.deep.equal(`###\n${mockLicenseText}`);
        });

        it ('should append a license', () => {
            const testDefaultFormat: ILicenseFormat = {
                append: '~~~',
            };

            const lf: LicenseFormatter = new LicenseFormatter(testDefaultFormat, TrailingWhitespaceMode.DEFAULT);

            const formatted = lf.formatLicenseForFile('ext', mockLicenseText);

            expect(formatted).to.deep.equal(`${mockLicenseText}\n~~~`);
        });

        it ('should prepend and append a license', () => {
            const testDefaultFormat: ILicenseFormat = {
                append: '~~~',
                prepend: '###',
            };

            const lf: LicenseFormatter = new LicenseFormatter(testDefaultFormat, TrailingWhitespaceMode.DEFAULT);

            const formatted = lf.formatLicenseForFile('ext', mockLicenseText);

            expect(formatted).to.deep.equal(`###\n${mockLicenseText}\n~~~`);
        });

        it ('should prepend each line', () => {
            const testDefaultFormat: ILicenseFormat = {
                eachLine: {
                    prepend: '### ',
                },
            };

            const lf: LicenseFormatter = new LicenseFormatter(testDefaultFormat, TrailingWhitespaceMode.DEFAULT);

            const formatted = lf.formatLicenseForFile('ext', mockLicenseText);

            expect(formatted).to.deep.equal(mockLicenseText.split(/\r\n|\n/).map((line) => '### ' + line).join(EOL));
        });

        it ('should append each line', () => {
            const testDefaultFormat: ILicenseFormat = {
                eachLine: {
                    append: '~~~',
                },
            };

            const lf: LicenseFormatter = new LicenseFormatter(testDefaultFormat, TrailingWhitespaceMode.DEFAULT);

            const formatted = lf.formatLicenseForFile('ext', mockLicenseText);

            expect(formatted).to.deep.equal(mockLicenseText.split(/\r\n|\n/).map((line) => line + '~~~').join(EOL));
        });

        it ('should prepend and append each line of a license', () => {
            const testDefaultFormat: ILicenseFormat = {
                eachLine: {
                    append: '~~~',
                    prepend: '### ',
                },
            };

            const lf: LicenseFormatter = new LicenseFormatter(testDefaultFormat, TrailingWhitespaceMode.DEFAULT);

            const formatted = lf.formatLicenseForFile('ext', mockLicenseText);

            expect(formatted).to.deep.equal(mockLicenseText.split(/\r\n|\n/).map((line) => '### ' + line + '~~~').join(EOL));
        });

        it ('should remove trailing whitespace on lines', () => {
            const testDefaultFormat: ILicenseFormat = {
                eachLine: {
                    prepend: '# ',
                },
            };

            const lf: LicenseFormatter = new LicenseFormatter(testDefaultFormat, TrailingWhitespaceMode.TRIM);

            const formatted = lf.formatLicenseForFile('ext', `license
with

blank
lines`);

            expect(formatted).to.deep.equal(`# license
# with
#
# blank
# lines`);
        });

        it ('should select matching formatting from specified formats', () => {
            const lf: LicenseFormatter = new LicenseFormatter(mockDefaultFormat, TrailingWhitespaceMode.DEFAULT);
            (lf as any).licenseFormats = mockFormats;

            const formatted = lf.formatLicenseForFile('sh', mockLicenseText);

            expect(formatted).to.deep.equal(mockLicenseText.split(/\r\n|\n/).map((line) => '# ' + line).join(EOL));
        });
    });

    describe ('separateFileTypesInFormat', () => {
        const lf: LicenseFormatter = new LicenseFormatter(mockDefaultFormat, TrailingWhitespaceMode.DEFAULT);

        it ('should split keys on pipe synbole', () => {
            const prependVal: ILicenseFormat = {
                prepend: 'this',
            };

            const appendVal: ILicenseFormat = {
                prepend: 'this',
            };

            const obj: IFormatCollection = {
                'some|delimitted': prependVal,
                'useful|keys': appendVal,
            };

            const splitObj = (lf as any).separateFileTypesInFormat(obj);

            expect(splitObj).to.deep.equal({
                '.delimitted': prependVal,
                '.keys': appendVal,
                '.some': prependVal,
                '.useful': appendVal,
            });
        });
    });
});
