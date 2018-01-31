# license-check-and-add

> license-check-and-add is an npm plugin that checks whether a specified piece of text is present at the top of files and if asked to do so inserts it.

## Install
```
npm install license-check-and-add
```

## Usage

### Running from npm
Add to your package.json a script for calling license-check-and-add and also the config:

```
"scripts": {
    "licchkadd": "license-check-and-add"
},
"license-check-and-add-config": {
    "folder": ".",
    "license": "header.txt",
    "exact_paths_method": "INCLUDE",
    "exact_paths": ["src"],
    "file_type_method": "EXCLUDE",
    "file_types": [".html", ".txt", ".json"],
    "insert_license": false
}
```

You can then run the script from the terminal using:

```
npm run licchkadd
```

In the example config described the checks are running to test whether the text in header.txt is found in files only within the folder src. It is explicitly not checking against files that have the extension .html, .txt and .json. It is not automatically adding the license to those files it finds which do not contain it. 

## Configuring

These are the options available for configuring license-check-and-add

### folder
The folder you wish to run the tests against. Can specify an absolute or relative path. Using `.` will run against the directory the process is run from.

### license
The file containing the license text you wish to text against. Can specify an absolute or relative path. Using just a name (e.g. header.txt) will run against a file of that name in the directory the process is run from.

### exact_paths_method
Can be set to INCLUDE or EXCLUDE. INCLUDE only runs against files whose names are specified in the `exact_paths` config element. EXCLUDE will run against all files in the `folder` configured and not against those specified in the `exact_paths` config element.

### exact_paths
The paths of files/folders are explicitly included or excluded. Can store either a folder name or file name. Paths can be absolute or relative but you cannot include a path that is not located with the folder or its subfolders specified in the `folder` config element (e.g. checking against current folder . and reference a path for include of ../include_me.txt).

### file_type_method
Can be set to INCLUDE or EXCLUDE. INCLUDE causes the checker to only check against files that have the an extension listed in the `file_types` config element. EXCLUDE causes it to run against all file types but ignore those listed in the `file_types` config element. 

### file types
List of file types to included or excluded from the search. Extensions require the preceding `.`.

### insert_license
True causes the checker to insert the license specified in the config into the top of any file it finds which does not contain it. 
