<table style="width: 100%; border-style: none;"><tr>
<td style="width: 140px; text-align: center;"><img src="docs/media/misc/cordova_logo_white_purple.png" /></td>
<td><strong>Visual Studio Team Services Extension for Cordova</strong><br />
<i>Streamline CI setup for your Apache Cordova, PhoneGap, Ionic, or Cordova CLI compatible app using a set of useful pre-defined build steps.</i><br />
<a href="http://go.microsoft.com/fwlink/?LinkID=691188">Install now!</a>
</td>
</tr></table>
# Visual Studio Team Services Extension for Cordova
Visual Studio Team Services (formerly Visual Studio Online) and Team Foundation Services (TFS) 2015 can be used for building and testing Cordova apps in a Continuous Integration (CI) environment thanks to a new [cross-platform agent](http://go.microsoft.com/fwlink/?LinkID=533789) that supports OSX. This new agent enables you to use Visual Studio Team Services (VSTS) or TFS to build projects targeting Android, iOS, or Windows created using [Tools for Apache Cordova](http://go.microsoft.com/fwlink/?LinkID=536496) or *any Cordova compliant CLI like the Ionic, PhoneGap, or TACO CLI.* 

This extension contains a set of VS Team Services "tasks" (or "build steps") that streamline setup when building Cordova based applications in a CI environment. These tasks can be used with either VSTS or TFS 2015 on-prem servers (see below) and are intended to work with any Cordova based project including, but not limited to, those created using Tools for Apache Cordova. The tasks:

- Are designed to work with Cordova and Cordova-like toolsets like Ionic
- Automatically acquire and cache the appropriate version of Cordova or related CLI (ex: Ionic) based on task settings or the contents of taco.json
- Enable simplified signing, certificate management, and packaging particularly for iOS
- Include support for Tools for Apache Cordova specific features
- Support the Android, iOS, Windows, and Windows Phone 8.0 (wp8) Cordova platforms
	
## 5 Step Quick Start

1. After installing the extension, upload your project to VSTS, TFS, or GitHub.

2. Go to your VSTS or TFS project, click on the **Build** tab, and create a new build definition (the "+" icon) and select the Empty template.

3. Click **Add build step...** and select **Cordova Build** from the **Build** category

4. Configure the build step - *Check out the tool tips for handy inline documentation.*

5. Add a **Demand** under the **General** tab of **xcode** to force the build to run on OSX or **cmd** to force it to run on Windows as appropriate

*Note: Be sure you are running version 0.3.10 or higher of the cross-platform agent and the latest Windows agent as these are required for VS Team Services extension to function. The VSTS hosted agent and [MacinCloud](http://go.microsoft.com/fwlink/?LinkID=691834) agents will already be on this version.*

## Usage and Tutorials
See the following articles on using these tasks in VSTS/TFS:

1. [Cordova Build Task](http://go.microsoft.com/fwlink/?LinkID=691186)
	- [Securing Signing Certs](http://go.microsoft.com/fwlink/?LinkID=691933)
2. [Cordova Command Task](http://go.microsoft.com/fwlink/?LinkID=692058)
3. [Ionic Command Task](http://go.microsoft.com/fwlink/?LinkID=692057)
4. [PhoneGap Command Task](http://go.microsoft.com/fwlink/?LinkID=692057)

##FAQ
**Q:** Android for Cordova 6.0.0 is failing to build when specifying a keystore path. How can I resolve this issue? <br />
**A:** This is a due to a Cordova bug that was resolved in Cordova 6.1.0. Use Cordova 5.4.1 or upgrade to 6.1.0+ to resolve.

**Q:** Android for Cordova 6.0.0 is failing to build on a Mac or Linux. How can I resolve this issue? <br />
**A:** This is a due to a Cordova bug that was resolved in Cordova 6.1.0. Use Cordova 5.4.1 or upgrade to 6.1.0+ to resolve.

**Q:** I am seeing Windows 10 builds fail in the VSTS Hosted Pool with a "Could not load file or assembly" error when using Cordova 5.4.x. How do I resolve this problem? <br />
**A:** This is a Cordova bug when 64-bit Node.js is used. Upgrade to 6.1.0+ to resolve. See the [Cordova bug](https://issues.apache.org/jira/browse/CB-9565?jql=text%20%7E%20%22An%20attempt%20was%20made%20to%20load%20a%20program%20with%20an%20incorrect%20format.%22) for details.

**Q:** Building for Cordova 5.1.1 is failing with an ENOENT error. How can i resolve this issue? <br />
**A:** This is due to a Cordova bug very specific to 5.1.1 where it fails to create some needed folders on a first time run. You can work around this in one of a few ways.

1. Run another build with another version of Cordova. This will create the folders that 5.1.1 needs. <br />
2. Create the needed folders manually. By default, the folders that need to be created are *~/.taco_home/node_modules/_cordova/lib/npm_cache* for OSX/Linux and *%APPDATA%/taco_home/node_modules/_cordova/lib/npm_cache* for Windows. Note that if *CORDOVA_CACHE* environment variable is set, the folder to be created is *$CORDOVA_CACHE/_cordova/lib/npm_cache*. 

**Q:** After Feb 14th, I am seeing the following error when referencing P12 file: "Command failed: /bin/sh -c /usr/bin/security find-identity -v -p codesigning ..." <br />
**A:** This is due to the Apple's WWDR certificate expiring on this date and an old certificate still being present on the system. To resolve, follow the steps [outlined by Apple here](https://developer.apple.com/support/certificates/expiration/). In particular, be sure to see "Xcode unable to create distribution builds for App Store submissions or Enterprise apps" and be sure to *remove any expired certificates* as this can cause the error to occur even after you've installed updated certificates. This *also affects development certs* despite the title.

**Q:** I am using my own Mac for a cross-platform agent and have it configured to run as a daemon. Signing is failing. How can I resolve this problem? <br />
**A:** Configure the agent as a launch agent (./svc.sh install agent) or run it as an interactive process (node agent/vsoagent.js) to ensure Xcode is able to access the appropriate keychains. See the [secure app signing](https://msdn.microsoft.com/Library/vs/alm/Build/apps/secure-certs) tutorial for additional details. You could also opt to use [MacinCloud](http://go.microsoft.com/fwlink/?LinkID=691834) instead.

##Installation

### Visual Studio Team Services / Visual Studio Online
1. Install the [Visual Studio Team Services Extension for Cordova](http://go.microsoft.com/fwlink/?LinkID=691188)

2. You will now find a series of Cordova related tasks in the "Build" category 

### TFS 2015 Update 1 or Earlier

1. [Enable basic auth](http://go.microsoft.com/fwlink/?LinkID=699518) in your TFS instance

2. Install the tfx-cli and login. If you already have the tfx-cli installed, be sure it is **0.3.6 or higher.**

	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	npm install -g tfx-cli
	tfx login --auth-type basic 
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

3. Enter your collection URL (Ex: https://localhost:8080/tfs/DefaultCollection) and user name and password. Do not include a slash (/) at the end of the collection URL.

4. Download the [latest release](http://go.microsoft.com/fwlink/?LinkID=691191) of the Cordova tasks locally and unzip

5. Type the following from the root of the repo from Windows:

	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	upload
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

	Or from a Mac:

	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	sh upload.sh
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

5. Profit!

## Contact Us
* [Follow us on Twitter](http://go.microsoft.com/fwlink/?LinkID=699449)
* [Email us your questions](mailto:/vscordovatools@microsoft.com)
* [Ask for help on StackOverflow](http://go.microsoft.com/fwlink/?LinkID=699448)

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
