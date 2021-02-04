import * as fs from 'fs-extra';
import * as path from 'path';

export function directoriesMatch (original, goal): boolean {
    return fs.readdirSync(original).every((fileOrDir) => {
        const fullPath = path.resolve(original, fileOrDir);
        const goalPath = path.resolve(goal, fileOrDir);

        if (fs.lstatSync(fullPath).isDirectory()) {
            return directoriesMatch(fullPath, goalPath);
        } else if (fullPath.endsWith('.ignorefile')) {
            return true; // skip the ignore file we had to copy over
        }

        return fs.readFileSync(fullPath).toString() === fs.readFileSync(goalPath).toString();
    });
}
