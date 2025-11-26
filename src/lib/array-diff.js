import {createPatch, applyPatch} from 'diff';

import * as jp from './jsonpath.js';

export function diffArray(arr1, arr2) {
  const str1 = stringify(arr1);
  const str2 = stringify(arr2);
  const patch = createPatch('array-diff', str1, str2, null, null, { context: 1 });
  if (!/^@@/m.test(patch)) {
    return null;
  }
  return patch;
}

export function applyArrayDiff(arr, diff) {
  const str = stringify(arr);
  const patchedStr = applyPatch(str, diff);
  if (patchedStr === false) {
    throw new Error('Failed to apply patch');
  }
  return parse(patchedStr);
}

/**
 * Flatten an object or array to a diff-friendly string representation.
 * @param {Object|Array} obj - The object or array to flatten.
 * @returns {string} - The flattened string representation.
 */
function stringify(obj) {
  return Array.from(_stringify(obj)).join('\n');
}
function *_stringify(obj, prefix = '') {
  if (Array.isArray(obj)) {
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

function parse(str) {
  const lines = str.split('\n');
  return _parse(lines);
}

function _parse(lines) {
  let root;
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^(\S+) = (.*)$/);
    const path = match[1];
    const valueStr = match[2];
    if (valueStr === 'sep') {
      let arr;
      [root, arr] = jp.set(root, path.slice(0, -2), [], false);
      arr.length += 1;
      // add a new slot for the next element
      continue;
    }
    const value = valueStr === 'undefined' ? undefined : JSON.parse(valueStr);
    [root] = jp.set(root, path, value);
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

