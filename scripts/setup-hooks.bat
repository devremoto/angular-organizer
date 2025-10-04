@echo off
REM Setup script for Windows

echo Setting up git hooks for Windows...

REM Copy the Windows pre-commit script to the standard pre-commit hook location
copy ".git\hooks\pre-commit.bat" ".git\hooks\pre-commit" >nul

echo Git hooks setup completed.
echo The pre-commit hook will now clean up old .vsix files automatically.