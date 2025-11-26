import {createPatch, applyPatch, parsePatch, formatPatch} from 'diff';

import * as jp from './jsonpath.js';

export function diffArray(arr1, arr2, {noDelete = false, ...options} = {}) {
  const str1 = stringify(arr1, options);
  const str2 = stringify(arr2, options);
  let patch = createPatch('array-diff', str1, str2, null, null, { context: 1 });
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

export function applyArrayDiff(arr, diff) {
  const str = stringify(arr, diff.options);
  const patchedStr = applyPatch(str, diff.patch);
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
    if (isAtomic && isAtomic(obj)) {
      yield `${prefix} = ${JSON.stringify(obj)}`;
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
      yield `${prefix} = ${JSON.stringify(obj)}`;
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
      const value = valueStr === 'undefined' ? undefined : JSON.parse(valueStr);
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

