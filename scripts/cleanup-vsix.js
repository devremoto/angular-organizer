#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Removes all .vsix files except the latest version
 */
function cleanupVsixFiles() {
    const rootDir = path.resolve(__dirname, '..');

    try {
        // Get all .vsix files in the root directory
        const files = fs.readdirSync(rootDir);
        const vsixFiles = files.filter(file => file.endsWith('.vsix'));

        if (vsixFiles.length <= 1) {
            console.log('Only one or no .vsix files found. Nothing to clean up.');
            return;
        }

        // Parse version numbers and sort by version
        const vsixWithVersions = vsixFiles.map(file => {
            const match = file.match(/angular-organizer-(\d+\.\d+\.\d+)\.vsix/);
            if (!match) {
                console.warn(`Warning: Could not parse version from ${file}`);
                return { file, version: [0, 0, 0], versionString: '0.0.0' };
            }

            const versionString = match[1];
            const version = versionString.split('.').map(num => parseInt(num, 10));
            return { file, version, versionString };
        });

        // Sort by version (descending - latest first)
        vsixWithVersions.sort((a, b) => {
            for (let i = 0; i < 3; i++) {
                if (a.version[i] !== b.version[i]) {
                    return b.version[i] - a.version[i];
                }
            }
            return 0;
        });

        const latestFile = vsixWithVersions[0];
        const filesToRemove = vsixWithVersions.slice(1);

        console.log(`Keeping latest version: ${latestFile.file} (v${latestFile.versionString})`);

        // Remove older versions
        filesToRemove.forEach(({ file, versionString }) => {
            const filePath = path.join(rootDir, file);
            try {
                fs.unlinkSync(filePath);
                console.log(`Removed: ${file} (v${versionString})`);
            } catch (error) {
                console.error(`Error removing ${file}: ${error.message}`);
            }
        });

        console.log(`Cleanup complete. Removed ${filesToRemove.length} old .vsix file(s).`);

    } catch (error) {
        console.error('Error during cleanup:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    cleanupVsixFiles();
}

module.exports = { cleanupVsixFiles };