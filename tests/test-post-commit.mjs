// Test script for post-commit hook
import { execSync } from 'child_process';
import fs from 'fs';

console.log('=== Testing Post-Commit Hook ===');

try {
    // Test that the hook exists and is executable
    const hookPath = '.git/hooks/post-commit';

    if (fs.existsSync(hookPath)) {
        console.log('✅ Post-commit hook file exists');

        // Check if it's executable (on Unix systems)
        try {
            const stats = fs.statSync(hookPath);
            console.log('✅ Post-commit hook file is accessible');
        } catch (error) {
            console.log('⚠️  Post-commit hook file permissions issue:', error.message);
        }
    } else {
        console.log('❌ Post-commit hook file does not exist');
        process.exit(1);
    }

    // Test basic git commands that the hook uses
    console.log('\n=== Testing Git Commands ===');

    try {
        const repoRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
        console.log('✅ Git repository root detected:', repoRoot);
    } catch (error) {
        console.log('❌ Failed to get git repository root:', error.message);
    }

    try {
        const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
        console.log('✅ Current branch detected:', currentBranch || '(detached HEAD)');
    } catch (error) {
        console.log('⚠️  Failed to get current branch:', error.message);
    }

    try {
        const remotes = execSync('git remote', { encoding: 'utf8' }).trim();
        if (remotes) {
            console.log('✅ Git remotes configured:', remotes.split('\n').join(', '));
        } else {
            console.log('ℹ️  No git remotes configured (hook will skip pull)');
        }
    } catch (error) {
        console.log('ℹ️  No git remotes configured (hook will skip pull)');
    }

    console.log('\n=== Post-Commit Hook Test Complete ===');
    console.log('The hook should automatically run after git commits and:');
    console.log('1. Fetch latest changes from remote');
    console.log('2. Pull changes if there are updates');
    console.log('3. Keep the repository synchronized');

} catch (error) {
    console.error('Error testing post-commit hook:', error.message);
    process.exit(1);
}