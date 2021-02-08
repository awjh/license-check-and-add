import gitignoreToGlob from 'gitignore-to-glob';
import * as globby from 'globby';
import * as path from 'path';

export const DEFAULT_IGNORES = [
    '**/node_modules', '**/dist', '**/.git',
    '**/LICENSE*', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.tif', '**/*.ico', '**/*.json', '**/*.zip', '**/*.tgz',
];

export class FileFinder {
    public static getPaths (ignore: string[], ignoreDefaultIgnores: boolean, ignoreFile?: string): string[] {
        let includes = ['**/*'];
        let ignores = ignore;

        if (ignoreFile) {
            console.debug('Using ignore file');
            includes = includes.concat(gitignoreToGlob(path.resolve(process.cwd(), ignoreFile)), '!' + ignoreFile);
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
}
