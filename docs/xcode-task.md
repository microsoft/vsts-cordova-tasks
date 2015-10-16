<properties pageTitle="Build Xcode Projects with Visual Studio Online or Team Foundation Services 2015"
  description="Build Xcode Projects with Visual Studio Online or Team Foundation Services 2015"
  services=""
  documentationCenter=""
  authors="clantz" />

# Build Xcode Projects with Visual Studio Online or Team Foundation Services 2015
The new Visual Studio Online (VSO) / Team Foundation Services (TFS) [cross-platform build agent](http://go.microsoft.com/fwlink/?LinkID=533789) can run on both OSX and Linux and thus is ideal for building Xcode projects. The agent is a Node.js based service that uses a HTTPS connection to your TFS 2015 server to fetch work. As a result, your OSX machine only needs to have HTTP access to your TFS instance but not the other way around. This makes setup and configuration quite simple. The agent is for use with TFS 2015 and Visual Studio Online's [next generation build system](http://go.microsoft.com/fwlink/?LinkID=533772), not the legacy XAML/MSBuild based system.

The pre-requisites in this case are simple: Your Mac needs to have Node.js, Xcode, and [xctool](https://github.com/facebook/xctool) (for testing) installed. Simply open the OSX Terminal app and follow these [setup instructions](http://go.microsoft.com/fwlink/?LinkID=533789). On startup the agent will automatically register itself with VSO / TFS when you start up the agent for the first time.

Because of its design, you can also easily use an **on-premise Mac or a cloud provider like [MacInCloud](http://www.macincloud.com) with Visual Studio Online.** The OSX machine simply needs to have HTTP access to your VSO domain URI. You do not need a VPN connection and VSO does not need access to the OSX machine. Simply enter the your VSO project's domain URI when prompted during agent setup (Ex: "https://myvsodomain.visualstudio.com"). All other setup instructions apply directly.

The Xcode Build task used here supports features to simplify configuration of code signing. See **[Simple, Secure CI App Signing](./secure-certs.md)** for details.

## Project Setup
For the purposes of this tutorial we will assume you are trying to build an iOS app but the concepts described here essentially translate to other Xcode builds.

There is really only one step required for configuring an Xcode project for a CI environment that is not done by default when you create an Xcode project. Xcode has the concept of schemes and you'll need to set one of these as "Shared" and add it to source control so it can be used during your CI builds.  Follow these steps:

1. In Xcode, open your project and go to **Product &gt; Scheme &gt; Manage Schemes...**

2. Check **Shared** next to the Scheme you want to use during CI. Remember the name of the scheme you shared as we will reference it later.

  ![Shared Scheme](media/xcode/xcode-1.png)

3. Now add the new files and folders in your .xcodeproj folder (specifically the xcsharedata folder to source control).

## Creating Your Build Definition
Detailed instructions on creating build definitions in TFS 2015 can be found in [its documentation](http://go.microsoft.com/fwlink/?LinkID=533772), but here are the specific settings you will need to use to configure a build.

While there is an Xcode Build Definition Template, we'll use "Empty" so you get a feel for why things are configured the way they are.

1.  Create a new build definition by selecting the "Build" tab for your VSO/TFS project, clicking the "+" icon, and selecting "Empty" as the template. 

2.  Now we will add a Xcode Build task.

	1.  Under the "Build" tab, add a new build step and select **Xcode** from the **Build** category.
	2.  Use the following settings:  
		- **Actions**: build
		- **Configuration**: Xcode can have any number of configurations but "Debug" and "Release" are there by default. We'll use $(Configuration) which gets this value from a **Variable**.
		- **SDK**: Run xcodebuild -showsdks to see the valid list of SDKs. Ex: "iphoneos", "iphonesimulator".  We'll use $(SDK) so it is set as a variable.
		- **Workspace Path**: This can be left to the default value unless you want to explicitly override it.
		- **Scheme**: Set this to the name of the Scheme you shared in your project
		- **Create App Pacakge**: Checked. This will automatically generate an app package (ipa) for your project once the build has completed.
	3.  There are a few other options worth noting:
		- The **Signing & Provisioning** category provides a number of options for making signing less complicated. See **[Simple, Secure CI App Signing](./secure-certs.md)** for details.
		- **Advanced &gt; Use xctool** will cause the build to use Facebook's [xctool](https://github.com/facebook/xctool) for the build instead of xcodebuild. We'll cover this more when we add in a test.
		- **Advanced &gt; Xcode Developer Path** allows you to specify the path of a different version of Xcode than is installed by default.  Ex: */Applications/Xcode6.4.app/Contents/Developer*

    ![Xcode Task](media/xcode/xcode-2.png)

3.  Next, click on the **Variables** tab and add in the Configuration and SDK variables. 
	- **Configuration**: Debug or Release
	- **SDK**: iphoneos

  ![Xcode Variables](media/xcode/xcode-3.png)

4.  As an optional step, you can configure your build to upload the resulting build artifacts to your TFS or VSO instance for easy access.

  1. Under the "Build" tab, add a new build step and select **Publish Artifact** from the **Build** category.
  2. Use the following settings:
		- **Copy Root**: The default location is **output/$(SDK)/$(Configuration)/$(Configuration)-$(SDK)/build.dsym**
		- **Contents:** *.ipa
		- **Artifact Name:** ipa
		- **Artifact Type:** Server

5.  Save and click "Queue Build..." to test it out!

## Adding In Tests
If you've created unit or UI tests in your Xcode project, you can run these and publish the results to VSO using **[xctool](https://github.com/facebook/xctool)**. Note you will need to have xctool installed on the OSX machine the cross-platform build agent is on as this is not part of Xcode itself.

> **Troubleshooting Tip**: If you are using Xcode 6.4 or earlier or are not on the latest version of xctool, you will not be able to run your tests if the VSO cross-platform agent is setup as a daemon or launch agent. **Xcode 7 and the latest xctool eliminate this limitation.** Once installed, you can even run Xcode 6.4 projects using xctool.

1. First, add another "Xcode Build" task with some slightly different settings. We'll configure these tests to run in the iOS Simulator.

	1. Under the "Build" tab, add a new build step and select **Xcode** from the **Build** category
	2. Move this to the top of your build definition (before build)
	3. Use the following settings:
  
		- **Actions**: test
		- **Configuration**: $(Configuration)
		- **SDK**: $(Test_SDK)
		- **Workspace Path**: The same value as your build.
		- **Scheme**: The same value as your build.
		- **Create App Pacakge**: Unchecked.
		- **Advanced &gt; Use xctool**: Checked.
		- **Advanced &gt; xctool Test Reporter Format**: junit:test-results.xml
		- **Advanced &gt; Xcode Developer Path**: The same value as your build.

  ![Xcode Test](media/xcode/xcode-4.png)

2. Next, click on the **Variables** tab and add **Test_SDK** as a variable set to **iphonesimulator** 

3. Next, we will configure the definition to publish your test results to VSO.

  1. Under the "Build" tab, add a new build step and select **Publish Test Results** from the **Test** category. 
  2. Move this to right after your test step.
  3. Use the following settings:  
		- **Test Result Format**: JUnit
		- **Test Results Files:** test-results.xml
		- **Control Options &gt; Always Run:** Be sure to heck this so your test results are published when the tests fail.

  ![Publish Test Results](media/xcode/xcode-5.png)

That's it!

