# bookmark to gist

This is a fork of [bookmark sync](https://github.com/dodying/Bookmark-Sync) though most of the code is rewritten.

Syncs browser bookmarks to a GitHub Gist. Support Firefoxs, Firefox for Android, Chromium-based browsers (MV2), and Edge for Android.

### 

### Usage

1. Create a [New personal access token](https://github.com/settings/personal-access-tokens), and grant `gist` permission.
2. Create a [new gist](https://gist.github.com/) with a file named `bookmark.json` and the content `null`.
3. Open the option page by clicking the extension icon.
4. Put in the token and gist ID.
5. Choose the sync mode.
6. Click Save.

Syncing runs periodically and when bookmarks change.

### How it works

First, it pulls the remote data, then applies it to the local bookmarks.

If there are local changes before the sync starts, the local changes will be patched to the remote data. Then, the merged data will be pushed to the remote.

During the initial sync, all local bookmarks are merged to the remote data, unless the Sync Mode is set to Pull Only.

If an error occurs while patching local changes to the remote data (e.g., if some bookmarks are deleted remotely), the patch is skipped and the changes are stored locally. You can view these changes on the Options page.

### Cross browser compatibility

#### Root folders

Firefox has four root folders:

* toolbar
* menu
* mobile
* other

Chrome has only three:

* toolbar
* mobile
* other

When pushing the data, all folders will be pushed to gist. When pulling, only supported folders will be pulled. Therefore bookmarks from Firefox's menu won't be synced to Chrome. (They still sync between Firefox browsers.)

#### Import issue in Firefox

There is no way to detect bookmark imports in Firefox. You have to make some changes (e.g. reorder a bookmark) to trigger syncs after importing/recovered from backup.

### Todos

* Support truncated response: https://docs.github.com/en/rest/gists/gists?apiVersion=2022-11-28#truncation

### Changelog

* 1.0.0 (Nov 26, 2025)

  - Initial release
