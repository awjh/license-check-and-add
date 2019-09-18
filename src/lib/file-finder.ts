import * as globby from 'globby';

export const DEFAULT_IGNORES = [
    '**/node_modules', '**/dist',
    '**/LICENSE*', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.tif', '**/*.ico', '**/*.json', '**/*.zip', '**/*.tgz',
];

export function getPaths (ignore: string[], ignoreDefaultIgnores: boolean): string[] {

    if (!ignoreDefaultIgnores) {
        ignore = ignore.concat(DEFAULT_IGNORES);
    }

    const paths = globby.sync('**/*', {
        dot: true,
        expandDirectories: true,
        ignore,
    });

    return paths;
}
