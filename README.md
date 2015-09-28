# vso-cordova-tasks
Visual Studio Online / TFS build tasks for Cordova app development.  See [TODOs](./docs/TODO.md) for known issues and things that still need to be done.

##Installation

1. Download the source repo locally 

2. If you have the tfx-cli installed on your machine, login using the following command. Otherwise skip to step 4.

	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	tfx login
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

3. Enter your VSO collection URL (Ex: https://my-vso-instance.visualsutdio.com/DefaultCollection) and an auth token. Note that you only need to use the "tfx login" command to switch collections not every time you need to upload. After logging in you can simply type "upload" from that point forward. Also, the upload script below will attempt to install the tfx-cli if it is not found and prompt you to specify a collection.

4. Type the following from the root of the repo from Windows:

	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	upload
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

	Or from a Mac:

	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	sh upload.sh
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

5. Profit!

##Decrypt File Task Setup for Windows
The decrypt task uses OpenSSL to decrypt which is available at the command line on OSX but may not be available on Windows. 

OpenSSL comes with the [Git for Windows](https://git-for-windows.github.io/) command line tools for Windows so if the "bin" folder in the installation directory (Ex: C:\Program Files (x86)\Git\bin) is in your path you should already have openssl as an available command in the command prompt.  If not, either install the Git command line tools and add them to your path or download a binary distribution of OpenSSL for Windows from [one of the community mirrors](http://go.microsoft.com/fwlink/?LinkID=627128) and it to your path.

##Usage
See the following articles on using these tasks in VSO/TFS:

1. [Cordova Build Task Usage](./docs/cordova-build-task.md)
2. [Decrypt File Task Usage](./docs/decrypt-file-task.md)

## Terms of Use
By downloading and running this project, you agree to the license terms of the third party application software, Microsoft products, and components to be installed. 

The third party software and products are provided to you by third parties. You are responsible for reading and accepting the relevant license terms for all software that will be installed. Microsoft grants you no rights to third party software.

## License
Unless otherwise mentioned, the code samples are released under the MIT license.

```
The MIT License (MIT)

Copyright (c) Microsoft Corporation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
