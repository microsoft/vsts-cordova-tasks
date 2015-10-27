@ECHO OFF
REM
REM  Copyright (c) Microsoft. All rights reserved.  
REM  Licensed under the MIT license. See LICENSE file in the project root for full license information.
REM
ECHO vso-cordova-tasks upload
ECHO Copyright Microsoft Corporation

CALL npm --version > NUL
IF NOT ERRORLEVEL==0 GOTO INSTALLFAILED

CALL tfx --version > NUL
IF NOT ERRORLEVEL==0 GOTO TFXINSTALL

:NPMINSTALL
ECHO Installing dependencies...
CALL npm install --only=prod
IF NOT ERRORLEVEL==0 GOTO INSTALLFAILED

:EXEC
CALL node bin/tfxupload.js
IF NOT ERRORLEVEL==0 GOTO UPLOADFAILED
EXIT /B 0

:TFXINSTALL
ECHO Installing tfx-cli...
CALL npm install -g tfx-cli
IF NOT ERRORLEVEL==0 GOTO INSTALLFAILED
ECHO Log in to the VSO/TFS collection you wish to deploy the tasks.
CALL tfx login
IF NOT ERRORLEVEL==0 GOTO LOGINFAILED
GOTO NPMINSTALL

:UPLOADFAILED
ECHO Failed to upload! Ensure Node.js is installed and in your path and you are logged into a VSO/TFS collection where you have build administration privileges.
EXIT /B 1

:INSTALLFAILED
ECHO Failed to install npm packages. Ensure Node.js is installed and node and npm are in your path.
EXIT /B 1

:LOGINFAILED
ECHO Login failed. Type "tfx login" to log in and then re-run this script.
EXIT /B 1

