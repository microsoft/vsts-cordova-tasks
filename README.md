# vso-cordova-tasks
Visual Studio Online / TFS build tasks for Cordova app development.  See [TODOs](./TODO.md) for known issues and things that still need to be done.

##Installation

1. Download the source repo locally 

2. If you have the tfx-cli installed on your machine, login using the following command. Otherwise skip to step 4.

	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	tfx login
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

3. Enter your VSO collection URL (Ex: https://my-vso-instance.visualsutdio.com/DefaultCollection) and an auth token. Note that you only need to use the "tfx login" command to switch collections not every time you need to upload. After logging in you can simply type "upload" from that point forward. Also, the upload script below will attempt to install the tfx-cli if it is not found and prompt you to specify a collection.

4. Type the following from the root of the repo from Windows:

	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	upload
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

	Or from a Mac:

	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	sh upload.sh
	~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

5. Profit!

##Decrypt File Task Setup for Windows
The decrypt task uses OpenSSL to decrypt which is available at the command line on OSX but may not be available on Windows. 

OpenSSL comes with the [Git for Windows](https://git-for-windows.github.io/) command line tools for Windows so if the "bin" folder in the installation directory (Ex: C:\Program Files (x86)\Git\bin) is in your path you should already have openssl as an available command in the command prompt.  If not, either install the Git command line tools and add them to your path or download a binary distribution of OpenSSL for Windows from [one of the community mirrors](http://openssl.org/community/binaries.html) and it to your path.

##Cordova Build Task Usage
After uploading to your collection you can find the Cordova build task under the Build category when creating build definitions. The task uses [taco-team-build](http://github.com/Microsoft/taco-team-build) and inherits its ability to dynamically acquire the appropriate version of Cordova. It automatically adds the platform you specify so there is no need to call additional Cordova CLI commands if your plugins are checked in with your project.

Build options are as follows:

1. **Platform**: Cordova platform to build. Valid options include android, ios, windows, and wp8.
2. **Configuration**: debug or release
3. **Target Architectures**: Space delimited list device architectures to build. Valid options for Windows include anycpu, x86, x84, and arm. Valid options for Android include x86 and arm.
4. **Cordova Version**: Version of Cordova tools to use to build. If not specified, looks at taco.json to determine the version and falls back on a default if no taco.json is found.

###Android Options

1. **Force Ant Build**: Forces Cordova to use Apache Ant to build instead of Gradle on version of Cordova 5.0.0 / Cordova Android 4.0.0 and up.
2. **Keystore File**: Optional relative path to a Java keystore file that should be used for signing your app.
3. **Keystore Password**: Password for the specified Keystore File.
4. **Key Alias**: Alias to the key to use for signing in the specified Keystore File.
5. **Key Password**: Password for key referenced by Key Alias in the specified Keystore File.

###iOS Options
iOS signing can be problematic so the task includes a few different options along with some common capabilities:

**Signing Using a Exported Identity in a P12 File**:

1. **P12 Certificate File**: Optional relative path to a PKCS12 formatted p12 certificate file containing a signing certificate to be used for this build. *Omit Signing Identity if specified.* Generates a temporary keychain with the signing certs that is then cleaned up after the build. Use the Decrypt File task to add further security by encrypting your P12 file before uploading and decrypting during the build.
2. **P12 Password**: Password to P12 Certificate File if specified. Use a Build Variable to encrypt.

**Signing Using the Default Keychain**:

1. **Signing Identity**: Optional signing identity override that should be used to sign the build. *Not required if P12 Certificate File specified.* You may need to select Unlock Default Keychain if you use this option. Cordova defaults to "iPhone Developer" for debug builds and "iPhone Distribution" for release builds.
2. **Unlock Default Keychain**: Resolve "User interaction is not allowed" errors by unlocking the default keychain.
3. **Default Keychain Password**: Password to unlock the default keychain when this option is set. Use a Build Variable to encrypt.

**Mobile Provisioning Profile Options**:

1. **Provisioning Profile UUID**: Optional UUID of an installed provisioning profile to be used for this build. Not required if Provisioning Profile File specified. Attempts to auto-match by default.
2. **Provisioning Profile File**: Optional relative path to file containing provisioning profile override to be used for this build. *Omit Provisioning Profile UUID if specified.* Use the Decrypt File task to add further security by encrypting your .mobileprovision file before uploading and decrypting during the build.
3. **Remove Profile After Build**: Specifies that the contents of the Provisioning Profile File should be removed from the build agent after the build is complete. *Only check if you are running one agent per user.*

**Other Options**:

1. **Xcode Developer Path**: Optional path to Xcode Developer folder if not the system default. For use when multiple versions of Xcode are installed on a system. Ex: /Applications/Xcode 7.app/Contents/Developer

###Windows Options

1. **Windows APPX Target**: Overrides type of APPX generated (Windows/Phone 8.1, 10). Valid values include: 8.1-win, 8.1-phone, uap (aka Windows/Phone 10) on Cordova 5.0.0 (Cordova Windows 4.0.0) and up.
2. **Target Windows Phone Only**: Only generate an appx that works on Windows Phone (when using Cordova 3.6.3 and up).
3. **Target Windows Only**: Only generate an appx that works on Windows.

###Advanced Options
1. **Arguments**: Additional Cordova CLI command line arguments that should be used to build.
2. **Working Directory**: Working directory for build runs. Defaults to the root of the repository.
3. **Output Directory**: Relative path where build output (binaries) will be placed.
4. **Build for Emulator/Simulator**: Build for a emulator or simulator instead of devices.

##Decrypt File Task Usage

1. **Cypher**: Encryption cypher to use. See [cypher suite names](http://openssl.org/docs/manmaster/apps/ciphers.html) for a complete list of possible values.
2. **Encrypted File**: Relative path of file to decrypt.
3. **Passphrase**: Passphrase to use for decryption. *Use a Variable to encrypt the passphrase.*
4. **Decrypted File Path**: Optional filename for decrypted file. Defaults to the Encrypted File with a ".out" extension.
5. **Working Directory**: Working directory for decryption. Defaults to the root of the repository.