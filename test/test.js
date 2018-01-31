'use strict';
/* global describe, it */

let license = require('../');

require('mocha');
let expect = require('chai').expect;
let path = require('path');
let sinon = require('sinon');

let fs = require('fs');

describe('license-check-and-add', () => {
    let config;
    let mockFs;
    beforeEach(() => {
      config = {
        "folder": path.join(__dirname, 'test-directory-structure'),
        "license": path.join(__dirname, 'test-license.txt'),
        "exact_paths_method": "EXCLUDE",
        "exact_paths": [],
        "file_type_method": "EXCLUDE",
        "file_types": [],
        "insert_license": false
      };
    });

    describe('module.exports.run', () => {
      it('should throw error if config not defined', () => {
          expect(() => {
            license.run();
          }).to.throw('You must define a minimum config e.g. one containing base_directory and license');
      });

      it('should throw error if folder not in config', () => {
          delete config.folder;

          expect(() => {
            license.run(config);
          }).to.throw('No folder passed');
      });

      it('should throw error if license not in config', () => {
          delete config.license;

          expect(() => {
            license.run(config);
          }).to.throw('No license passed');
      });

      it('should throw error if passed exact_paths not an array', () => {
          config.exact_paths = '';

          expect(() => {
            license.run(config);
          }).to.throw('exact_paths is not an array');
      });

      it('should throw error if passed file_types not an array', () => {
          config.file_types = '';

          expect(() => {
            license.run(config);
          }).to.throw('file_types is not an array');
      });

      it('should handle exact_paths not set in the config', () => {
          delete config.exact_paths;

          expect(() => {
            license.run(config);
          }).to.throw('License Check failed. 2 file(s) did not have the license.');
      });

      it('should handle file_types not set in the config', () => {
          delete config.file_types;

          expect(() => {
            license.run(config);
          }).to.throw('License Check failed. 2 file(s) did not have the license.');
      });

      it('should error when files do not contain license', () => {
          expect(() => {
            license.run(config);
          }).to.throw('License Check failed. 2 file(s) did not have the license.');
      })

      it('should ignore files and directories in exact_paths when exact_paths_method set to EXCLUDE', () => {
          config.exact_paths = ['file.js', 'sub-directory'];

          expect(license.run(config)).to.deep.equal(true);
      });

      it('should only test against files that are in exact_paths when exact_paths_method not set to EXCLUDE', () => {
        config.exact_paths = ['file.js'];
        config.exact_paths_method = 'INCLUDE';

        expect(() => {
          license.run(config);
        }).to.throw('License Check failed. 1 file(s) did not have the license.');
      });

      it('should only test against directories that are in exact_paths when exact_paths_method not set to EXCLUDE', () => {
        config.exact_paths = ['sub-directory'];
        config.exact_paths_method = 'INCLUDE';

        expect(() => {
          license.run(config);
        }).to.throw('License Check failed. 1 file(s) did not have the license.');
      })

      it('should exclude files of types in file_types when file_type_method set to EXCLUDE', () => {
        config.file_types = ['.js'];

        expect(license.run(config)).to.deep.equal(true);
      });

      it('should include files of types in file_types when file_type_method is not set to INCLUDE', () => {
        config.file_types = ['.js'];
        config.file_type_method = 'INCLUDE';

        expect(() => {
          license.run(config);
        }).to.throw('License Check failed. 2 file(s) did not have the license.');
      });

      it('should exclude files of types in file_types when file_type_method set to EXCLUDE when exact_paths_method is set to INCLUDE', () => {
        config.exact_paths = ['sub-directory'];
        config.exact_paths_method = 'INCLUDE';
        config.file_types = ['.js'];

        expect(license.run(config)).to.deep.equal(true);
      });

      it('should include files of types in file_types when file_type_method set to INCLUDE when exact_paths_method is not set to INCLUDE', () => {
        config.exact_paths = ['sub-directory'];
        config.exact_paths_method = 'INCLUDE';
        config.file_types = ['.js'];
        config.file_type_method = 'INCLUDE';

        expect(() => {
          license.run(config);
        }).to.throw('License Check failed. 1 file(s) did not have the license.');
      });

      it('should add the license to a file when insert_license is true', () => {
          config.insert_license = true;
          config.exact_paths = ['sub-directory'];
          config.exact_paths_method = 'INCLUDE';
          let writeFileSync = sinon.stub(fs, 'writeFileSync');

          expect(license.run(config)).to.deep.equal(true);

          let file = fs.readFileSync(path.join(__dirname, 'test-directory-structure/sub-directory/sub-file.js')).toString();
          let license_text = fs.readFileSync(config.license).toString();
          var expected_text = license_text + '\n' + file;

          expect(writeFileSync.withArgs(path.join(__dirname, 'test-directory-structure/sub-directory/sub-file.js'), expected_text)).to.be.ok;

          writeFileSync.restore();
      });

      it('should return true when all files contain the license', () => {
        config = {
            "folder": __dirname,
            "license": path.join(__dirname, 'test-license.txt'),
            "exact_paths_method": "INCLUDE",
            "exact_paths": [path.join(__dirname, 'test-license.txt')],
            "file_type_method": "EXCLUDE",
            "file_types": [],
            "insert_license": false
        };

        expect(license.run(config)).to.deep.equal(true);
      });

    });

    // TEST PATH GOING ALL THE WAY THROUGH BUT STUB WRITEFILESYNC TO PREVENT CHANGES

});
