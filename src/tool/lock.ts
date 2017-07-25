const fs = require('fs-extra');
const path = require('path');

function getLockFile (directory: string) {
    return path.join(directory, ".as3-to-typescript");
}

export function getLockTimestamp (directory: string): Date {
    let lockfile = getLockFile( directory );
    let timestamp = new Date();

    if (fs.existsSync(lockfile)) {
        let stat = fs.statSync(lockfile);
        timestamp = stat.atime;
    }

    return timestamp
}

export function updateLockTimestamp (directory: string, timestamp: number) {
    let lockfile = getLockFile( directory );

    if (!fs.existsSync(lockfile)) {
        fs.outputFileSync(lockfile, "");
    }

    fs.utimesSync(lockfile, timestamp, timestamp);
}
