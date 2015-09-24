# vso-cordova-tasks
Visual Studio Online / TFS build tasks for Cordova app development

##Installation

1. Download the source repo locally 

2. If you have the tfx-cli installed on your machine, login using the following command. Otherwise skip to step 4.

	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	tfx login
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

3. Enter your VSO collection URL (Ex: https://my-vso-instance.visualsutdio.com/DefaultCollection) and an auth token. Note that you only need to use the "tfx login" command to switch collections not every time you need to upload. After logging in you can simply type "upload" from that point forward. Also, the upload script below will attempt to install the tfx-cli if it is not found and prompt you to specify a collection.

4. Type the following from the root of the repo:

	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	upload
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

5. Profit!

##Decrypt File Task Setup for Windows
The decrypt task uses OpenSSL to decrypt which is available at the command line on OSX but may not be available on Windows. 

Download a binary distribution of OpenSSL for Windows from [one of the community mirrors](http://openssl.org/community/binaries.html).

You can then do one of two things:
1. Install it on your build servers and add it to the path - which often occurs by installing the Git command line tools for Windows
2. Copy openssl.exe into the Tasks/DecryptFile folder in a local copy of this repository before uploading the task to the build server.

See [TODOs](./TODO.md) for known issues and things that still need to be done.
