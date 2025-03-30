import path from 'node:path';
import fs from 'node:fs/promises';

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const scanDir = async (dir) => {
    const files = new Set();
    const entries = await fs.readdir(dir, { withFileTypes: true, recursive: true });

    for (const entry of entries) {
        const fullpath = path.join(dir, entry.name);

        if (entry.isFile()) {
            files.add(path.relative(dir, fullpath));
        }
    }

    return files;
}

const compareDirectories = async (dir1, dir2) => {
    const dir1Files = await scanDir(dir1);
    const dir2Files = await scanDir(dir2);

    const commonFiles = new Set([...dir1Files].filter(file => dir2Files.has(file)));

    const onlyInDir1 = new Set([...dir1Files].filter(file => !dir2Files.has(file)));
    const onlyInDir2 = new Set([...dir2Files].filter(file => !dir1Files.has(file)));

    return { commonFiles, onlyInDir1, onlyInDir2 };
}

const argv = yargs(hideBin(process.argv))
    .command('$0 <dir1> <dir2>', 'compare directories', {
        dir1: {
            positional: true,
            type: 'string',
            normalize: true,
        },
        dir2: {
            positional: true,
            type: 'string',
            normalize: true,
        },
        summary: {
            alias: 's',
            type: 'boolean',
            description: 'Show summary only',
            default: false,
        }
    })
    .argv;

const { dir1, dir2, summary } = argv;

const result = compareDirectories(dir1, dir2);

if (summary) {
    // Summary statistics
    console.log('Summary:');
    console.log(`- Files in both directories: ${result.commonFiles.size}`);
    console.log(`- Files only in ${dir1}: ${result.onlyInDir1.size}`);
    console.log(`- Files only in ${dir2}: ${result.onlyInDir2.size}`);
}

// Detailed listings
if (result.commonFiles.size > 0) {
    console.log('\nFiles in both directories:');
    [...result.commonFiles].sort().forEach(file => {
        console.log(`  ${file}`);
    });
}

if (result.onlyInDir1.size > 0) {
    console.log(`\nFiles only in ${dir1}:`);
    [...result.onlyInDir1].sort().forEach(file => {
        console.log(`  ${file}`);
    });
}

if (result.onlyInDir2.size > 0) {
    console.log(`\nFiles only in ${dir2}:`);
    [...result.onlyInDir2].sort().forEach(file => {
        console.log(`  ${file}`);
    });
}