# License check and add

license-check-and-add is an npm module to check whether a specified piece of text is present in specific formats for a set of files. It also can insert the formatted text into files that do not contain it or remove it from those that do. It supports pattern matching within a license to allow for more flexibility in areas such as copyright notices.

## Install
``` bash
npm install -D license-check-and-add
```

## Usage
license-check-and-add is run using the following command either in your terminal if installed globally or as an npm script if installed locally to a module.

``` bash
license-check-and-add [check|add|remove] -f [path/to/config.json]
```

The tool will check against files in the directory and its sub-directories unless they are specifically ignored. By default the command will ignore the following directories:

- node_modules
- dist

and files with the extensations:
- png
- jpg
- jpeg
- gif
- tif
- ico
- json
- zip
- tgz

You can turn off this default ignoring in the config file.

### Additional command options
#### -r/--regex-replacements
This option is only for use with the add sub-command. It is for use when combined with the [regexIdentifier](#regexIdentifier) option of the configuration and with licenses that contain one or more pattern within them. It takes an array of values which should match the number of patterns within the license. If there are more patterns within the license than replacements specified hunder this option an error will occur. It is possible to supply only one option when used with multiple patterns and this option will be used for all. Note that replacements passed must satisfy the pattern they are replacing.

##### Example:
Given the license text `Copyright (c) ##[0-9]{4}## ##[a-z]+##` and a configuation with the field `"regexIdentifier": "##"`.

Running the command:
``` bash
license-check-and-add add -f [path/to/config.json] -r 2021 awjh
```

Would result in the license `Copyright (c) 2021 awjh` being inserted at the top of your selected files.

## Configuring
Configuration is expected in a JSON format. You can find a schema [here](https://github.com/awjh/license-check-and-add/blob/master/config-schema.json). An example config can be found in our [tests](https://github.com/awjh/license-check-and-add/blob/master/test/non-regex/license-check-and-add-config.json)

### Required fields

#### license
The path to the file containing the unformatted license text to check/add/remove. You can specify and absolute or relative path. Relative paths will be taken relative to the location where the command is run rather than the config file.

### Optional fields

#### ignoreDefaultIgnores
Boolean value to specify whether or not to use the default ignores specified above. Setting to `true` will mean that those are NOT used.

#### ignoreFile
A string pointing to a file containing a list of files or folders for the license checker to ignore. This can be your gitignore file. The list of files to be ignore can be added to by using the ignore options.

#### ignore
An array of globby strings specifying which files to ignore (e.g. ["**/*.txt"]). This list will be used in combination with the default ignore list unless you specify not to use that list. You can make use of `!` to add exceptions to ignores within the list. It will also be used with, but will not override, an ignore file if using the ignoreFile option.

#### trailingWhitespace
By default this is set such that whitespace at the end of lines in a license is ignored. This means in `add` mode should your license contain a blank line and your formatting for that license contain a space after a prepend (for example ` * `) then the blank line would have trailing whitespace. It also means when searching for licenses (such as in `check` mode) a file will match even if its license lines finish in whitespace when the formatted license lines do not. Setting the value of this property to be `TRIM` will enforce both when checking and adding the license that the file's license contains no whitespace at the end of lines. This can be useful for ensuring that when the license is inserted it meets linting requirements.

#### regexIdentifier
It is possible with this tool to supply a license which contains regex pattern matching so that it can match multiple formats of the same license. The string here is the string that will be on either side of the pattern in your license so that it can be identified against regex characters that are not intended for pattern mtaching such as full stops. For example if you had a license with the line `Copyright (c) ##[0-9]{4}##` then the value for this configuration would be `##` as that bookends the pattern. Note that patterns must be entirely contained within one line and must be bookended. You may have multiple patterns in one line. You can find an example of this in the regex folder of our tests:
- Config -> https://github.com/awjh/license-check-and-add/blob/master/test/regex/license-check-and-add-config.json
- License -> https://github.com/awjh/license-check-and-add/blob/master/test/regex/original-files/LICENSE

#### output
File location where list of relevent files should be sent to.
- `check` - list of files missing licenses
- `add` - list of files with licenses added
- `remove` - list of files with licenses removed

#### licenseFormats
Describes how the license should be formatted for different file types. A [format object](#format-object) should be used for each entry. You can share a format object for multiple file types by separating the file with a "|". Entries in this field will overwrite the [default formats](#default-formats). Example:

``` json
"ts|js": {
    "eachLine": {
        "prepend": "// "
    }
}
```

The above example will tell the checker to expect the license to be formatted such that each line of the license in a typescript or javascript file starts with `// `. If the tool is in `add` mode the license will be inserted in that format also. 

> Note: if you are specifying a file starting with a dot such as `.gitignore` do NOT include the leading dot.

To include a file which contains no `.` use a `^` at the start of the filename. Example:

``` json
"sh|^Dockerfile": {
    "eachLine": {
        "prepend": "# "
    }
}
```

The above will determine the license format for both files with the extension `.sh` and also files named just `Dockerfile`.

#### defaultFormat
The format the license should take if a file type is iterated over by a checker that is not one of the [default formats](#default-formats) or specified in the licenseFormats section. If this value is not set then a default format of 

``` json
{
    "prepend": "/*",
    "append": "*/"
}
```

will be used.

## Format object
A format object is used in the configuration fields default_format and license_formats. The object is used to specify how a license should start, how a license should end and how each line should start and end. Alternatively it can specify a specific file that should be used as the license. Using a format object allows you to comment out licenses in files where they may have an impact if left as text and use the same license file for multiple file types.

Specifying a format object to point to a file:
``` json
{
    "file": "/my/path/to/a/license"
}
```

Specifying a format object to write a line at the start and end of the license:
``` json
{
    "prepend": "<!--",
    "append": "-->"
}
```

Specifying a format object to write at the start and end of each line of the license:
``` json
{
    "eachLine": {
        "prepend": "<!-- ",
        "append": " -->"
    }
}
```

> Note: You can combine prepend, append and eachLine formats but file should be used alone.

### <a name="default-formats" >Default formats</a>
``` json
{
    "gitignore|npmignore|eslintignore|dockerignore|sh|py": {
        "eachLine": {
            "prepend": "# ",
        },
    },
    "html|xml|svg": {
        "prepend": "<!--",
        "append": "-->",
    },
    "js|ts|css|scss|less|php|as|c|java|cpp|go|cto|acl": {
        "prepend": "/*",
        "append": "*/",
    },
    "txt": {},
}
```
