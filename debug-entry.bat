@echo off
REM Debug Entry Batch Script for Windows
REM Builds the project and starts the MCP server

REM Build the project (suppress output)
call npm run build >nul 2>&1
if %errorlevel% neq 0 (
    echo Build failed 1>&2
    exit /b 1
)

REM Start the MCP server
node build/index.js