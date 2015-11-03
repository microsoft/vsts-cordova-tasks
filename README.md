# vso-cordova-tasks
Visual Studio Online (VSO) and Team Foundation Services (TFS) 2015 can both be used for building and testing Cordova apps in a Continuous Integration (CI) environment thanks to a new [cross-platform agent](http://go.microsoft.com/fwlink/?LinkID=533789) that enables VSO or TFS to build directly on Windows or OSX. Further, [Tools for Apache Cordova](http://go.microsoft.com/fwlink/?LinkID=536496) is designed to work with a number of different CI systems since the projects it creates are standard [Apache Cordova Command Line interface](http://go.microsoft.com/fwlink/?LinkID=533773) (CLI) projects. The end result is you can use VSO or TFS to build projects created using Tools for Apache Cordova or any Cordova compliant CLI project like Ionic or the TACO CLI.

<div style="text-align:center"><img src="./docs/media/misc/taco-800.png" /></div>

This repository contains a set of VSO "tasks" (or "build steps") wrapped in a VSO Extension that can be used to streamline setup when building Cordova based applications in a CI environment. These tasks can also be used with a TFS 2015 on prem server and are intended to work with any Cordova based project not just Tools for Apache Cordova. The tasks are designed to automatically acquire the specified version of Cordova or related CLI based on the contents of taco.json or input options and cache the CLI to speed up subsequent builds. The Cordova Build task is designed to work with Cordova and Cordova-like toolsets like Ionic and provides some convenient signing related features.

##Installation

### Visual Studio Online
1. Install the [Cordova Extension for Visual Studio Online](http://go.microsoft.com/fwlink/?LinkID=691188)

2. You will now find a series of Cordova related tasks in the "Build" category 

### TFS 2015 Update 1 or Earlier

1. Download the [latest release](http://go.microsoft.com/fwlink/?LinkID=691191) of the tasks locally and unzip

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

##Usage
See the following articles on using these tasks in VSO/TFS:

1. [Cordova Build Task](http://go.microsoft.com/fwlink/?LinkID=691186)
	- [Securing Signing Certs](http://go.microsoft.com/fwlink/?LinkID=691933)
2. [Cordova Command Task](http://go.microsoft.com/fwlink/?LinkID=692058)
3. [Ionic Command Task](http://go.microsoft.com/fwlink/?LinkID=692057)

To be implemented:

1. TACO CLI Command Task
2. PhoneGap CLI Command Task

There are gaps and known issues for most tasks. See [TODOs](./docs/TODO.md) for more information.

## Terms of Use
By downloading and running this project, you agree to the license terms of the third party application software, Microsoft products, and components to be installed. 

The third party software and products are provided to you by third parties. You are responsible for reading and accepting the relevant license terms for all software that will be installed. Microsoft grants you no rights to third party software.

## License

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
