# License check and add

license-check-and-add is an npm module to check whether a specified piece of text is present in specific formats for a set of files. It also can insert the formatted text into files that do not contain it or remove it from those that do.

## Install
``` bash
npm install -D license-check-and-add
```

## Usage
license-check-and-add is run using the following command either in your terminal if installed globally or as an npm script if installed locally to a module.

```
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

## Configuring
Configuration is expected in a JSON format. You can find a schema [here](https://github.com/awjh/license-check-and-add/blob/master/config-schema.json). An example schema can be found in our [unit tests](https://github.com/awjh/license-check-and-add/blob/master/test/license-check-and-add-config.json)

### Required fields

#### license
The path to the file containing the unformatted license text to check/add/remove. You can specify and absolute or relative path. Relative paths will be taken relative to the location where the command is run rather than the config file.

### Optional fields

#### ignoreDefaultIgnores
Boolean value to specify whether or not to use the default ignores specified above. Setting to `true` will mean that those are NOT used.

#### ignore
Either the path to an ignore style file (e.g. gitignore) or an array of globby strings specifying which files to ignore (e.g. ["**/*.txt"]). This list will be used in combination with the default ignore list unless you specify not to use that list.

#### licenseFormats
Describes how the license should be formatted for different file types. A [format object](#format-object) should be used for each entry. You can share a format object for multiple file types by separating the file with a "|". Entries in this field will overright the [default formats](#default-format). Example:

``` json
"ts|js": {
    "eachLine": {
        "prepend": "// "
    }
}
```

The above example will tell the checker to expect the license to be formatted such that each line of the license in a typescript or javascript file starts with `// `. If the license is in insert mode the license will be inserted in that format also. 

> Note: if you are specifying a file starting with a dot such as `.gitignore` do NOT include the leading dot.

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