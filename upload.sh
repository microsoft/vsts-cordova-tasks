#
#  Copyright (c) Microsoft. All rights reserved.  
#  Licensed under the MIT license. See LICENSE file in the project root for full license information.
#

echo "vso-cordova-tasks upload"
echo "Copyright Microsoft Corporation"

if ! type "npm" > /dev/null; then
  echo Could not find npm. Be sure node.js is installed and both node and npm are in your path.
  exit 1;
fi

if ! type "tfx" > /dev/null; then
  echo Installing tfx-cli...
  npm install -g tfx-cli
  if [ $? -ne 0 ]
  then
    echo "Failed to install tfx-cli."
    exit 1
  fi
  echo Log in to the VSO/TFS collection you wish to deploy the tasks.
  tfx login
  if [ $? -ne 0 ]
  then
    echo "Login failed. Type 'tfx login' to log in and then run this script again."
    exit 1
  fi
fi

echo Installing dependencies...
npm install --only=prod
if [ $? -ne 0 ]
then
  echo "Failed to install dependencies."
  exit 1
fi

node bin/tfxupload.js
if [ $? -ne 0 ]
then
  echo "Upload failed!"
  exit 1
fi
