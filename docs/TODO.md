#To dos

##Known Issues / Cleanup tasks
1. (In-progress, but patch needs to stay for now.) Had to monkey patch vso-task-lib to work on the Windows VSO build agent. Need to update vso-task-lib itself to better support working this way.

##To dos: taco-team-build
1. P2: Refactor taco-team-build to encapsulate singing features (Tasks/CordovaBuild/cordova-task.js iosIdentity, iosProfile, processAndroidInputs, code in execBuild + writeVsoXcconfig, writeAntProperties)

##To dos: Cordova Build Task
6. P2: Implement population of Windows related signing proprties in config.xml and expose those as optional through the VSO task
7. P2: Allow people to opt out of installing the support plugin
8. P2: Implement JDK selection capabilities for Android similar to the Gradle task

##To dos: Upload Script
1. P2: Get rid of npm install warnings visible in upload script
