<properties pageTitle="The Cordova/Ionic Command Tasks for Visual Studio Online or Team Foundation Services 2015"
  description="The Cordova/Ionic Command Tasks for Visual Studio Online or Team Foundation Services 2015"
  services=""
  documentationCenter=""
  authors="bursteg, clantz" />

# The Cordova/Ionic Command Tasks for Visual Studio Online and Team Foundation Services 2015
Visual Studio Online (VSO) and Team Foundation Services (TFS) 2015 can be used for building and testing Cordova apps in a Continuous Integration (CI) environment thanks to a new [cross-platform agent](http://go.microsoft.com/fwlink/?LinkID=533789) that supports OSX. The end result is you can use VSO or TFS to build projects created using [Tools for Apache Cordova](http://go.microsoft.com/fwlink/?LinkID=536496) or *any Cordova compliant CLI project like Ionic or the TACO CLI*. 

> If you need to use the legacy XAML/MSBuild based build system, see the [TFS 2013](http://go.microsoft.com/fwlink/?LinkID=533770) tutorial in Tools for Apache Cordova documentation for details.

To streamline CI for Cordova-based projects, we have created a series of build tasks (or steps) that you can use: **[Cordova Build](http://go.microsoft.com/fwlink/?LinkID=691186), [Cordova Command](http://go.microsoft.com/fwlink/?LinkID=692058),** and **[Ionic Command](http://go.microsoft.com/fwlink/?LinkID=692057)**. 

Generally you should only need to use the **[Cordova Build](http://go.microsoft.com/fwlink/?LinkID=691186)** task even when building something like an Ionic project (and it has some useful features in this specific area). However, if you want to run a non-build CLI related command, use the Cordova and Ionic Command tasks. This article will specifically focus the Command tasks. See the [Cordova Build](http://go.microsoft.com/fwlink/?LinkID=691186) tutorial for details on building and testing along with information on setting up your own build agent.


## Project Setup & Build Definitions

### Installing the Command Tasks
To use the Command tasks with a Cordova based project in Visual Studio Online or TFS 2015, you will need to first install it in your collection.

- **Visual Studio Online**: For Visual Studio Online, this is easy to do. Simply install the [Visual Studio Online Extension for Cordova](http://go.microsoft.com/fwlink/?LinkID=691835). 

- **TFS 2015 Update 1 and Earlier**: TFS 2015 Update 1 and below does not support installing VSO Extensions. Fortunately, the installation of the Cordova task is still relatively easy to do by following these simple steps:
  1. Download the latest release of [vso-cordova-tasks](http://go.microsoft.com/fwlink/?LinkID=691191) and unzip it locally
  2. Navigate to the unzipped folder from the command prompt
  3. Simply type "upload" and follow the instructions that appear. You can also update the task following these same steps.

### Creating Your Build Definitions
Detailed instructions on creating build definitions in TFS 2015 can be found in [its documentation](http://go.microsoft.com/fwlink/?LinkID=533772), but here are the specific settings you will need to use to configure a build. 

First, create a new build definition by selecting the "Build" tab for your VSO/TFS project, clicking the "+" icon, and selecting "Empty" as the template. Next use one of the commands as specified below.

#### The Cordova Command Task
1. Add the Cordova Command task to your build definition by going to the "Build" tab, adding a new build step, and selecting **Cordova Command** from the **Build** category

  Available Settings:
    - **Command**: The CLI command.  For example "plugin".
    - **Arguments**: Additional arguments for the command.  Ex: "add cordova-plugin-camera"
    - **Cordova Version**: If you're using Tools for Apache Cordova you can leave this blank and the correct version will be used based on the contents of taco.json. Otherwise, if not specified, uses the version specified by the CORDOVA_DEFAULT_VERSION environment variable (like in VSO) or the latest if no environment variable is set.
    - **Advanced &gt; Working Directory**: Location of the Cordova project itself inside your solution (not the solution root).

2.  Next, given the task is cross-platform, if you want to be sure this build definition only runs on Windows or OSX, you will need to add a demand that "Cmd" exists for Windows...

	![Windows Build Definition - Demand](media/cordova-command/cordova-command-1.png)

  ... or "xcode" exists for OSX...  
  
  ![OSX Build Definition - Demand](media/cordova-command/cordova-command-2.png)

#### The Ionic Command Task
The Ionic Command task is similar to the Cordova one. Add the Cordova Command task to your build definition by going to the "Build" tab, adding a new build step, and selecting **Ionic Command** from the **Build** category

Available Settings:
  - **Command**: The CLI command.  For example "state".
  - **Arguments**: Additional arguments for the command.  Ex: "restore"
  - **Ionic Version**: If not specified, uses the version specified by the IONIC_DEFAULT_VERSION environment variable (like in VSO) or the latest if no environment variable is set.
  - **Cordova Version**: The Ionic CLI also expects the Cordova CLI to be availabe.  If you're using Tools for Apache Cordova you can leave this blank and the correct version will be used based on the contents of taco.json. Otherwise, if not specified, uses the version specified by the IONIC_DEFAULT_VERSION environment variable (like in VSO) or the latest if no environment variable is set.
  - **Advanced &gt; Working Directory**: Location of the Cordova project itself inside your solution (not the solution root).

## More Information
* [Learn about the Cordova Build task and setting up your own agent](http://go.microsoft.com/fwlink/?LinkID=691186)
* [Check out the source code](http://go.microsoft.com/fwlink/?LinkID=691187)
* [Learn about Tools for Apache Cordova](http://go.microsoft.com/fwlink/?LinkID=618473)
* [Read tutorials and learn about tips, tricks, and known issues for Cordova](http://go.microsoft.com/fwlink/?LinkID=618471)
* [Download samples from our Cordova Samples repository](http://github.com/Microsoft/cordova-samples)
* [Follow us on Twitter](https://twitter.com/VSCordovaTools)
* [Visit our site http://aka.ms/cordova](http://aka.ms/cordova)
* [Ask for help on StackOverflow](http://stackoverflow.com/questions/tagged/visual-studio-cordova)
