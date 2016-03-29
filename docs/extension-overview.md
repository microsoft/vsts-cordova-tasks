Visual Studio Team Services (formerly Visual Studio Online) and Team Foundation Services (TFS) 2015 can be used for building and testing Cordova apps in a Continuous Integration (CI) environment thanks to a new [cross-platform agent](http://go.microsoft.com/fwlink/?LinkID=533789) that supports OSX. This new agent enables you to use Visual Studio Team Services (VSTS) or TFS to build projects targeting Android, iOS, or Windows created using [Tools for Apache Cordova](http://go.microsoft.com/fwlink/?LinkID=536496) or *any Cordova compliant CLI like the Ionic, PhoneGap, or TACO CLI.* 

## Visual Studio Team Services Extension for Cordova

This extension contains a set of VS Team Services "tasks" (or "build steps") that streamline setup when building Cordova based applications in a CI environment. These tasks can be used with either VSTS or TFS 2015 on-prem servers (see below) and are intended to work with any Cordova based project including, but not limited to, those created using Tools for Apache Cordova. The tasks:
- Are designed to work with Cordova and Cordova-like toolsets like Ionic
- Automatically acquire and cache the appropriate version of Cordova or related CLI (ex: Ionic) based on task settings or the contents of taco.json
- Enable simplified signing, certificate management, and packaging particularly for iOS
- Include support for Tools for Apache Cordova specific features
- Support the Android, iOS, Windows, and Windows Phone 8.0 (wp8) Cordova platforms
	
## Quick Start

1. After installing the extension, upload your project to VSTS, TFS, or GitHub.
2. Go to your VSTS or TFS project, click on the **Build** tab, and create a new build definition (the "+" icon) and select the Empty template.
3. Click **Add build step...** and select **Cordova Build** from the **Build** category
4. Configure the build step - *Check out the tool tips for handy inline documentation.*
5. Add a **Demand** under the **General** tab of **xcode** to force the build to run on OSX or **cmd** to force it to run on Windows as appropriate

*Note: Be sure you are running version 0.3.10 or higher of the cross-platform agent and the latest Windows agent as these are required for VS Team Services extension to function. The VSTS hosted agent and [MacinCloud](http://go.microsoft.com/fwlink/?LinkID=691834) agents will already be on this version.*

## Usage and Tutorials
See the following articles for details on using these tasks in VSTS/TFS:

1. [Cordova Build](http://go.microsoft.com/fwlink/?LinkID=691186)
	- [Securing Signing Certs](http://go.microsoft.com/fwlink/?LinkID=691933)
2. [Cordova Command](http://go.microsoft.com/fwlink/?LinkID=692058)
3. [Ionic Command](http://go.microsoft.com/fwlink/?LinkID=692057)
4. [PhoneGap Command](http://go.microsoft.com/fwlink/?LinkID=692057)

##FAQ
**Q:** Android for Cordova 6.0.0 is failing to build when specifying a keystore path. How can I resolve this issue?

**A:** This is a due to a Cordova bug that was resolved in Cordova 6.1.0. Use Cordova 5.4.1 or upgrade to 6.1.0+ to resolve.

**Q:** Android for Cordova 6.0.0 is failing to build on a Mac or Linux. How can I resolve this issue?

**A:** This is a due to a Cordova bug that was resolved in Cordova 6.1.0. Use Cordova 5.4.1 or upgrade to 6.1.0+ to resolve.

**Q:** I am seeing Windows 10 builds fail in the VSTS Hosted Pool with a "Could not load file or assembly" error when using Cordova 5.4.x. How do I resolve this problem?

**A:** This is a Cordova bug when 64-bit Node.js is used. Upgrade to 6.1.0+ to resolve. See the [Cordova bug](https://issues.apache.org/jira/browse/CB-9565?jql=text%20%7E%20%22An%20attempt%20was%20made%20to%20load%20a%20program%20with%20an%20incorrect%20format.%22) for details.

**Q:** After Feb 14th, I am seeing the following error when referencing P12 file: "Command failed: /bin/sh -c /usr/bin/security find-identity -v -p codesigning ..."

**A:** This is due to the Apple's WWDR certificate expiring on this date and an old certificate still being present on the system. To resolve, follow the steps outlined by Apple here: https://developer.apple.com/support/certificates/expiration/ In particular, be sure to see "What should I do if Xcode doesn’t recognize my distribution certificate?" and be sure to **remove any expired certificates** as this can cause the error to occur even after you've installed updated certificates. This **also affects development certs** despite the title.

**Q:** I am using my own Mac for a cross-platform agent and have it configured to run as a daemon. Signing is failing. How can I resolve this problem?

**A:** Configure the agent as a launch agent (./svc.sh install agent) or run it as an interactive process (node agent/vsoagent.js) to ensure Xcode is able to access the appropriate keychains. See the [secure app signing](https://msdn.microsoft.com/Library/vs/alm/Build/apps/secure-certs) tutorial for additional details. You could also opt to use [MacinCloud](http://go.microsoft.com/fwlink/?LinkID=691834) instead.

## Installation for TFS 2015 Update 1 or Earlier

See the [source code repository](http://go.microsoft.com/fwlink/?LinkID=691187) for instructions on installing these tasks on TFS 2015 Update 1 or earlier.

## Contact Us
* [Follow us on Twitter](http://go.microsoft.com/fwlink/?LinkID=699449)
* [Email us your questions](mailto:vscordovatools@microsoft.com)
* [Ask for help on StackOverflow](http://go.microsoft.com/fwlink/?LinkID=699448)
* [File an issue on GitHub](http://go.microsoft.com/fwlink/?LinkID=699450)
* [View or contribute to the source code](http://go.microsoft.com/fwlink/?LinkID=691187)
