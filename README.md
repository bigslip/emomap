# EmoMap Emotional Mapping Project

## Building EmoMap

EmoMap is a cordova project. To build EmoMap, first install [Apache Cordova](https://cordova.apache.org/).

Open a command window in the project folder.

### Add platforms

Add the platforms you want to run EmoMap on:

```
cordova platform add android
cordova platform add browser
```

### Install plugins

EmoMap makes use of some Cordova plugins, which need to be installed.

```
cordova plugin add https://git-wip-us.apache.org/repos/asf/cordova-plugin-device.git
cordova plugin add https://git-wip-us.apache.org/repos/asf/cordova-plugin-network-information.git
cordova plugin add https://git-wip-us.apache.org/repos/asf/cordova-plugin-geolocation.git
cordova plugin add cordova-plugin-globalization
cordova plugin add cordova.plugins.diagnostic
cordova plugin add cordova-plugin-dialogs
```

### Run your database

Run a local CouchDB instance. Create a file `www/settings.js` and put the following content in:

```js
var SETTINGS = {
	db_points_url = '<Your CouchDB URL: emotional contribution database>',
	db_users_url = '<Your CouchDB URL: user database>'
};
```

### Building EmoMap

Now you can build and run the app:

```
cordova build browser
cordova run browser
```

