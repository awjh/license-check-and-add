import gitignoreToGlob from 'gitignore-to-glob';
import * as globby from 'globby';
import * as path from 'path';

export const DEFAULT_IGNORES = [
    '**/node_modules', '**/dist',
    '**/LICENSE*', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.tif', '**/*.ico', '**/*.json', '**/*.zip', '**/*.tgz',
];

export function getPaths (ignore: string | string[], ignoreDefaultIgnores: boolean): string[] {

    let includes = ['**/*'];
    let ignores = [];

    if (!Array.isArray(ignore)) {
        console.debug('Using ignore file');
        includes = includes.concat(gitignoreToGlob(path.resolve(process.cwd(), ignore as string)));
    } else {
        ignores = ignore;
    }

    if (!ignoreDefaultIgnores) {
        ignores = ignores.concat(DEFAULT_IGNORES);
    }

    return globby.sync(includes, {
        dot: true,
        expandDirectories: true,
        ignore: ignores,
    });
}
