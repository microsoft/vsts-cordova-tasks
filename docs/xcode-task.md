<properties pageTitle="Use the Visual Studio Tools for Apache Cordova with Visual Studio Online or Team Foundation Services 2015"
  description="Use the Visual Studio Tools for Apache Cordova with Visual Studio Online or Team Foundation Services 2015"
  services=""
  documentationCenter=""
  authors="bursteg, clantz" />

# Build Xcode Projects with Visual Studio Online or Team Foundation Services 2015

<a name="vso"></a>
## Visual Studio Online

## Project Setup & Build Definitions
For the purposes of this tutorial we will assume you are trying to build an iOS app but the concepts described here essentially translate to other Xcode builds.

There is really only one step required for configuring an Xcode project for a CI environment that is not done by default when you create an Xcode project. Xcode has the concept of schemes and you'll need to set one of these as "Shared" and add it to source control so it can be used during your CI builds.  Follow these steps:

1. In Xcode, open your project and go to **Product &gt; Scheme &gt; Manage Schemes...**

2. Check **Shared** next to the Scheme you want to use during CI. Remember the name of the scheme you shared as we will reference it later.

  ![Shared Scheme](media/xcode/xcode-1.png)

3. Now add the new files and folders in your .xcodeproj folder (specifically the xcsharedata folder to source control).

### Creating Your Build Definition
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
		- The **Signing & Provisioning** category provides a number of options for making signing less difficult. Signing setup can be painful, so see **[Simple, Secure CI App Signing](./secure-certs.md)** for details.
		- **Advanced &gt; Use xctool** will cause the build to use Facebook's xctool for the build instead of xcodebuild. We'll cover this more when we add in a test.
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

### Adding In Tests
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

