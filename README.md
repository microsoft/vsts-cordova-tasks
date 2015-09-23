# vso-cordova-tasks
Visual Studio Online / TFS build tasks for Cordova app development

##Installation
Download the source repo locally and type the following:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
npm install -g tfx-cli
tfx login
upload
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Enter your VSO collection URL (Ex: https://my-vso-instance.visualsutdio.com/DefaultCollection) and an auth token when prompted. Note that you only need to use the "tfx login" command to switch collections not every time you need to upload. After logging in you can simply type "upload" from that point forward.

See [TODOs](./TODO.md) for known issues and things that still need to be done.
