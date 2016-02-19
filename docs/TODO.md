#To dos

##Known Issues / Cleanup tasks
1. (In-progress, but patch needs to stay for now.) Had to monkey patch vso-task-lib to work on the Windows VSO build agent. Need to update vso-task-lib itself to better support working this way.

##To dos: taco-team-build
1. P2: Refactor taco-team-build to encapsulate singing features (Tasks/CordovaBuild/cordova-task.js iosIdentity, iosProfile, processAndroidInputs, code in execBuild + writeVsoXcconfig, writeAntProperties)

##To dos: Cordova Build Task
1. P2: Additional telemetry for some key information:
	1. Cordova versions used - pulled either from the VSO task or taco.json. Likely should be added to taco-team-build
	2. Which signing approach is being used for iOS. Likely can key off the radio button on the task.
	3. Breakdown of builds by platform - key'd off the "platform" attribute
	4. This is in addition to basic usage metrics we should get from VSO itself already - but we need to understand how 5. P2 unless tenet requires it: Localization of task.json contents (no node localization support yet available in vso agent)
6. P2: Implement population of Windows related signing proprties in config.xml and expose those as optional through the VSO task
7. P2: Allow people to opt out of installing the support plugin
8. P2: Implement JDK selection capabilities for Android similar to the Gradle task

##To do: Other tasks to create
1. P2: TACO CLI Command Task - Started. Automatically uses latest TACO Cli version if not specified. Blocked on bug currently.

##To dos: Upload Script
1. P2: Get rid of npm install warnings visible in upload script
