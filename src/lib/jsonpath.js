// set value at path in object
// path may include [] representing the last element of an array
const RX = /[\w$]+|\.[\w$]+|\[\]/y;
export function set(root, path, value, {conflict = 'overwrite'} = {}) {
  const parts = [];
  RX.lastIndex = 0;
  let match;
  let lastValue;
  while ((match = RX.exec(path)) !== null) {
    const part = match[0];
    if (part.startsWith('.')) {
      parts.push(part.slice(1));
    } else {
      parts.push(part);
    }
  }
  root = buildObj(root, 0);
  return [root, lastValue];

  function buildObj(obj, index) {
    if (index >= parts.length) {
      if (obj !== undefined && conflict === 'skip') {
        lastValue = obj;
        return obj;
      }
      lastValue = value;
      return value;
    }
    let part = parts[index];
    const isArrayPart = part === '[]';
    if (!obj) {
      if (isArrayPart) {
        obj = [];
      } else {
        obj = {};
      }
    }
    if (isArrayPart) {
      if (!obj.length) {
        obj.push(undefined);
      }
      part = obj.length - 1;
    }
    if (isArrayPart && index === parts.length - 1 && conflict === 'append' && obj[ part ] !== undefined) {
      obj.push(buildObj(undefined, index + 1));
    } else {
      obj[ part ] = buildObj(obj[ part ], index + 1);
    }
    return obj;
  }
}

export function traverse(obj, callback) {
  callback(obj);
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      traverse(obj[i], callback);
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (const key of Object.keys(obj)) {
      traverse(obj[key], callback);
    }
  }
}
