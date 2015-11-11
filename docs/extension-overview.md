Visual Studio Online (VSO) and Team Foundation Services (TFS) 2015 can be used for building and testing Cordova apps in a Continuous Integration (CI) environment thanks to a new [cross-platform agent](http://go.microsoft.com/fwlink/?LinkID=533789) agent that supports OSX. This new agent enables you to use VSO or TFS to build projects targeting Android, iOS, or Windows created using [Tools for Apache Cordova](http://go.microsoft.com/fwlink/?LinkID=536496) or *any Cordova compliant CLI project like Ionic, PhoneGap (local), or the TACO CLI.* This extension contains a set of VSO "tasks" (or "build steps") that streamline setup when building Cordova based applications in a CI environment.

## Highlights

These tasks can be used with either VSO or TFS 2015 on-prem server (see below for installation details) and are intended to work with any Cordova based project not just Tools for Apache Cordova. The tasks:
- Are designed to work with Cordova and Cordova-like toolsets like Ionic
- Automatically acquire and cache the appropriate version of Cordova or related CLI (ex: Ionic) based on task settings or the contents of taco.json
- Enable simplified signing, certificate management, and packaging particularly for iOS
- Include support for Tools for Apache Cordova specific features
- Support the Android, iOS, Windows, and Windows Phone 8.0 (wp8) Cordova platforms
	
## 5 Step Quick Start

1. After installing the extension, upload your project to Visual Studio Online, TFS, or GitHub.
2. Go to your Visual Studio Online or TFS project, click on the **Build** tab, and create a new build definition (the "+" icon).
3. Click **Add build step...** and select **Cordova Build** from the **Build** category
4. Configure the build step - *Check out the tool tips for handy inline documentation.*
5. Add a **Demand** under the **General** tab of **xcode** to force the build to run on OSX or **cmd** to force it to run on Windows as appropriate

## Usage and Tutorials
See the following articles on using these tasks in VSO/TFS:

1. [Cordova Build](http://go.microsoft.com/fwlink/?LinkID=691186)
	- [Securing Signing Certs](http://go.microsoft.com/fwlink/?LinkID=691933)
2. [Cordova Command](http://go.microsoft.com/fwlink/?LinkID=692058)
3. [Ionic Command](http://go.microsoft.com/fwlink/?LinkID=692057)

##Installation for TFS 2015 Update 1 or Earlier

1. Download the [latest release](http://go.microsoft.com/fwlink/?LinkID=691191) of the tasks locally and unzip

2. If you have the tfx-cli installed on your machine, login using the following command. Otherwise skip to step 4.

	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	tfx login
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

3. Enter your VSO collection URL (Ex: https://my-vso-instance.visualsutdio.com/DefaultCollection) and an auth token. 

4. Type the following from the root of the repo from Windows:

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
