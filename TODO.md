#To dos

##taco-team-build
1. Move lib/taco-team-build/cordova-plugin-vs-taco-support/hooks/hook-execute-bit-fix.js code into taco-team-build in getCordova(). Existing logic won't fire when taco-team-build adds platforms if one already exist without execute bits. Then drop from plugin.
2. Merge these changes along with existing edits into core Microsoft/taco-team-build and Microsoft/cordova-vs-taco-support-plugin repos. 
3. Update sub-module in taco-team-build to latest commit.  Still need to reference this way because plugins.cordova.io is now read only so there's no way to publish the support plugin for use with Cordova < 4.0.0
4. Publish taco-team-build, cordova-plugin-vs-taco-support to npm
5. Update Tasks/CordovaBuild/package.json to reference the npm location of taco-team-build, remove /lib/taco-team-build from the vso-cordova-tasks repo
6. P2: Refactor taco-team-build to encapsulate singing features (Tasks/CordovaBuild/cordova-task.js iosIdentity, iosProfile, processAndroidInputs, code in execBuild + writeVsoXcconfig, writeAntProperties)

##CordovaBuild Task
1. Implement population of Windows related signing proprties in config.xml and expose those as optional through the VSO task
2. Work with VSO team to deal with warning messages that appear for logging events - unclear why this is happening
3. Test, test, test, test, test
	1. Cordova 3.5.0
	2. Cordova 4.3.1
	3. Cordova 5.1.1
	4. Cordova 5.3.1
	5. Variations:
		1. iOS specifying p12 and mobile prov
		2. iOS when running vsoagent as daemon: 
			1. iOS specifying signing identity and uuid, unlock keychain
			2. iOS no arguments and certs already setup, unlock keychain
		4. Android w/no signing details
		5. Android w/ signing details
		6. Windows with no arguments specified, no contents in config.xml
		7. Windows with no arguments specified, contents in config.xml from VS
		8. Windows with signing args specified in task

##Decrypt Task
1. Implement Windows version of the decrypt task. Openssl is not available on Windows by default, so we'll need to either find an alternate decrypt method, require openssl be on the system in the path, or ship openssl with the task (which has LCA implications - though it looks like shipping it has been approved for C&E previously)

##VSO Extension
1. Work with the VSO team to create a VSO extension encapsulating Cordova tasks
2. Iron out LCA concerns - We'll need to distribute dependant OSS that is not in the agent itself.
	1. Task installs are 100% unattended and therefore failures are not very visible. Dynamic acquisition is a risky proposition as a result. In an ideal world we'd publish the contents of the node_modules folder for each task with the VSO extension to avoid issues.
	2. Failing that, a possible workaround that has some risk is to update the core VSO agent with the node modules we need and then add a "npm install" step into bootstrap.ps1 that fires if and only if the node_modules folder is missing from the task. This should reslove the problem though its a bit error prone since task installs are unattended.

##General Repo To-dos
1. Create README.md
2. On-prem TFS will not support VSO extensions until Update 2 sometime mid-2016. As a result we'll need to maintain the update.cmd and author an update.sh script for on-prem deployments w/o an extension.
