# Bookmark Sync

### [Firefox Addon](https://addons.mozilla.org/firefox/addon/bookmark-sync/)

Inspired by [shanalikhan/code-settings-sync](https://github.com/shanalikhan/code-settings-sync) and Xmarks is dead :cry:

### Usage

1. Cteate a [New personal access token](https://github.com/settings/tokens/new), and add `gist` in scope. [Like this](https://github.com/shanalikhan/code-settings-sync#steps-to-get-a-personal-access-token-from-github)
2. Create a [new gist](https://gist.github.com/) with a file named `bookmark.json` and the content `null`.
3. Put in the token and gist ID in the option page.

### Details:

Syncing starts automatically after the settings are saved or when the bookmarks change.

First, it pulls the remote data, then applies it to the local bookmarks.

If there are local changes before the sync starts, the local changes will be patched to the remote data. Then, the merged data will be pushed to the remote.

During the initial sync, all local bookmarks are appended to the remote data, unless the Sync Mode is set to Pull Only.

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
