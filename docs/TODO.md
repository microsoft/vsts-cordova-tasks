#To dos

##Known Issues / Cleanup tasks
1. Had to monkey patch vso-task-lib to work on the Windows VSO build agent. Need to update vso-task-lib itself to better support working this way.
2. Elimate the use of fs.existsSync in favor of fs.statSync or fs.accessSync since it has been deprecated in recent versions of Node. (Affects taco-team-build, support plugin, VSO task)
3. P2: Refactor taco-team-build to encapsulate singing features (Tasks/CordovaBuild/cordova-task.js iosIdentity, iosProfile, processAndroidInputs, code in execBuild + writeVsoXcconfig, writeAntProperties)

##To dos: taco-team-build
1. Refactor to use globally installed Cordova version unless specified either explicitly or via DEFAULT_CORDOVA_VERSION env var - which is for VSO.  Allow "latest" to convert to actual latest version number.
2. Move lib/taco-team-build/cordova-plugin-vs-taco-support/hooks/hook-execute-bit-fix.js code into taco-team-build in getCordova(). Existing logic won't fire when taco-team-build adds platforms if one already exist without execute bits. Then drop from plugin.
3. Merge in latest changes from lib to taco-team-build - Latest refactoring enables using cache w/o loading Cordova module
4. Publish taco-team-build, cordova-plugin-vs-taco-support to npm
5. Update Tasks/CordovaBuild/package.json and others to reference the npm location of taco-team-build, remove /lib/taco-team-build from the vso-cordova-tasks repo

##To dos: Cordova Build Task
1. In-progress: Work with VSO team to deal with warning messages that appear for logging events. This appears to be a VSO Windows agent bug. Fix is in progress and the VSO team is looking to enable node scripts from the Windows agent which allows us to do away with the powershell boostrap.  TBD on timelines.
2. Test, test, test, test, test
	1. Cordova 3.5.0 - Version of cordova that requires the "cordova" lib instead of cordova-lib since numbering differed
	2. Cordova 3.6.3 - Last supported version in VS 2013
	3. Cordova 4.3.1 - Last Ant based build version
	4. Cordova 5.1.1 - Default version in TACO 1.0 and first solid Gradle based build version along with Win 10
	5. Cordova 5.3.3 - Most recent
	6. Variations:
		1. iOS specifying p12 and mobile prov
		2. iOS when running vsoagent as daemon: 
			1. iOS specifying signing identity and uuid, unlock keychain
			2. iOS no arguments and certs already setup, unlock keychain
		4. Android w/no signing details
		5. Android w/ signing details
		6. Windows features after signing features added:
			1. Windows with no arguments specified, no contents in config.xml
			2. Windows with no arguments specified, contents in config.xml from VS
			3. Windows with signing args specified in task
4. Telemetry for some key information:
	1. Cordova versions used - pulled either from the VSO task or taco.json. Likely should be added to taco-team-build
	2. Which signing approach is being used for iOS. Likely can key off the radio button on the task.
	3. Breakdown of builds by platform - key'd off the "platform" attribute
	4. This is in addition to basic usage metrics we should get from VSO itself already - but we need to understand how to get data from on-prem TFS too (if possible)
5. Update More Information "fwlink" location in all tasks in task.json
6. Allow people to opt out of installing the support plugin
6. Localization of task.json contents (no node localization support yet available in vso agent)
7. P2: Implement population of Windows related signing proprties in config.xml and expose those as optional through the VSO task
8. P2: Implement JDK selection capabilities for Android similar to the Gradle task
9. P2: Only specify Android args for signing for versions of Cordova that support it (4.0.0+)

##To do: Other tasks to create
1. P1: Ionic (CLI) Command Task - Started.
	1. Refactor to use the latest version of Ionic unless specified.  Enable a DEFAULT_IONIC_VERSION env var like the cordova one to set a default which is useful for VSO where only certain versions will be cached.
2. P1: TACO CLI Command Task
2. P2: PhoneGap (CLI) Command Task
3. P2: Pre-cache these CLIs in VSO

##To dos: Decrypt Task
1. **Remove from repo! Has been merged into vso-agent-tasks main repo.** Left here for convienenc when testing.

##To dos: VSO Extension
1. Work with the VSO team to create a VSO extension encapsulating Cordova tasks
2. Iron out LCA concerns - We'll need to distribute dependant OSS that is not in the agent itself.
	1. Task installs are 100% unattended and therefore failures are not very visible. Dynamic acquisition is a risky proposition as a result. In an ideal world we'd publish the contents of the node_modules folder for each task with the VSO extension to avoid issues.
	2. Failing that, a possible workaround that has some risk is to update the core VSO agent with the node modules we need and then add a "npm install" step into bootstrap.ps1 that fires if and only if the node_modules folder is missing from the task. This should reslove the problem though its a bit error prone since task installs are unattended.

##To dos: Upload Script
1. Test more!
2. Get rid of npm install warnings visible in upload script

##To do: Cordova VSO cache script
1. Update with the latest few versions of Cordova
2. Update with any test npm modules we want to reccomend
3. Refactor cache script after investigating switching taco-team-build to reuse TACO code or the newly released version-manager-cordova-software as an alternate way to acuqire and manage cordova versions instead of the custom logic in taco-team-build that pre-dated these modules.
4. Cache Ionic, Taco CLIs, maybe PG
