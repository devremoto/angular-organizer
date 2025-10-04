#!/bin/bash
# Setup script for Unix-like systems (Linux, macOS)

echo "Setting up git hooks for Unix/Linux/macOS..."

# Make the pre-commit hook executable
chmod +x .git/hooks/pre-commit

# Make the post-commit hook executable
chmod +x .git/hooks/post-commit

echo "Git hooks setup completed."
echo "The pre-commit hook will now clean up old .vsix files automatically."
echo "The post-commit hook will pull latest changes after each commit."