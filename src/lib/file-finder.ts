import * as globby from 'globby';

export function getPaths (ignore: string[], ignoreDefaults: boolean): string[] {

    const defaultIgnores = [
        '**/node_modules', '**/dist',
        '**/LICENSE*', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.tif', '**/*.ico', '*.json',
    ];

    if (!ignoreDefaults) {
        ignore = ignore.concat(defaultIgnores);
    }

    const paths = globby.sync('**/*', {
        dot: true,
        expandDirectories: true,
        ignore,
    });

    return paths;
}
