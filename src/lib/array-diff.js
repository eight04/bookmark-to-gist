import {createPatch, applyPatch, parsePatch, formatPatch} from 'diff';
import jsonStringify from "safe-stable-stringify";

import * as jp from './jsonpath.js';

/**
 * Diff two arrays (object) and produce a patch.
 * @param {Array|Object} arr1 - The original array.
 * @param {Array|Object} arr2 - The modified array.
 * @param {Object} [options] - Options for diffing.
 * @param {boolean} [options.noDelete=false] - If true, do not include deletions in the patch.
 * @param {(obj) => boolean} [options.isAtomic] - A function to determine if an object should be treated as atomic. This will affect whether the entire object will be replaced or the properties of the object will be replaced.
 * @returns {Object|null} - The patch object or null if no changes.
 */
export function diffArray(arr1, arr2, {noDelete = false, context, ...options} = {}) {
  const str1 = stringify(arr1, options);
  const str2 = stringify(arr2, options);
  // FIXME: context should be calculated based on the size of the first hunk
  if (context == null) {
    context = Math.min(1, Math.round(str1.split('\n').length / 2));
  }
  let patch = createPatch('array-diff', str1, str2, null, null, { context });
  // const changes = diffLines(str1, str2);
  if (!/^@@/m.test(patch)) {
    return null;
  }
  if (noDelete) {
    const parsedPatch = parsePatch(patch);
    for (const p of parsedPatch) {
      for (const hunk of p.hunks) {
        hunk.lines = hunk.lines.map(line => {
          if (line.startsWith('-')) {
            hunk.newLines++;
            return ' ' + line.slice(1);
          }
          return line;
        });
      }
    }
    patch = formatPatch(parsedPatch);
  }
  return {patch, options: {noDelete, ...options}};
}

/**
 * Apply a patch to an array (object)
 * @param {Array|Object} arr - The original array.
 * @param {Object} diff - The patch object produced by `diffArray`.
 * @returns {Array|Object} - The modified array after applying the patch. This is not the same object as the input array.
 */
export function applyArrayDiff(arr, diff, {fuzzFactor = 20} = {}) {
  const str = stringify(arr, diff.options);
  // FIXME: how to choose fuzzFactor?
  const patchedStr = applyPatch(str, diff.patch, { fuzzFactor });
  if (patchedStr === false) {
    throw new Error('Failed to apply patch');
  }
  return parse(patchedStr, diff.options);
}

/**
 * Flatten an object or array to a diff-friendly string representation.
 * @param {Object|Array} obj - The object or array to flatten.
 * @returns {string} - The flattened string representation.
 */
function stringify(obj, {isAtomic} = {}) {
  return Array.from(_stringify(obj)).join('\n');

  function *_stringify(obj, prefix = '') {
    if (typeof obj === "object" && obj !== null && isAtomic?.(obj)) {
      yield `${prefix} = ${jsonStringify(obj)}`;
    } else if (Array.isArray(obj)) {
      // yield `${prefix} = []`;
      for (const item of obj) {
        yield `${prefix}[] = sep`;
        yield* _stringify(item, `${prefix}[]`);
      }
      yield `${prefix}[] = sep`;
    } else if (typeof obj === 'object' && obj !== null) {
      if (Object.keys(obj).length === 0) {
        yield `${prefix} = {}`;
      } else {
        for (const key of Object.keys(obj).sort()) {
          yield* _stringify(obj[key], `${prefix}.${key}`);
        }
      }
    } else if (obj === undefined) {
      yield `${prefix} = undefined`;
    } else {
      if (/\.[^[\]]*$/.test(prefix)) {
        // property of an object
        // keep them separated so changing value will still have one path line unchange
        yield `${prefix} = nol`;
        yield `${prefix} = ${JSON.stringify(obj)}`;
      } else {
        yield `${prefix} = ${JSON.stringify(obj)}`;
      }
    }
  }
}


function parse(str, {noDelete = false} = {}) {
  const lines = str.split('\n');
  return _parse(lines);

  function _parse(lines) {
    let root;
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^(\S+) = (.*)$/);
      const path = match[1];
      const valueStr = match[2];
      if (valueStr === 'sep') {
        let arr;
        [root, arr] = jp.set(root, path.slice(0, -2), [], {conflict: "skip"});
        arr.length += 1;
        // add a new slot for the next element
        continue;
      }
      let value;
      if (valueStr === 'nol') {
        continue;
        // value = JSON.parse(lines[i]);
      } else {
        value = valueStr === 'undefined' ? undefined : JSON.parse(valueStr);
      }
      [root] = jp.set(root, path, value, {conflict: noDelete ? "append" : "overwrite"});
    }
    // Clean up trailing empty slots in arrays
    jp.traverse(root, obj => {
      if (Array.isArray(obj)) {
        if (obj.length > 0 && obj[obj.length - 1] === undefined) {
          obj.length -= 1;
        }
      }
    });
    return root;
  }
}
