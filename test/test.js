import test from "node:test";
import assert from "node:assert/strict";

import {diffArray, applyArrayDiff} from "../src/lib/array-diff.js";

test("sample test", () => {
  const changes = diffArray([1, 2, 3], [1, 2, 4, 5]);
  const result = applyArrayDiff([3], changes);
  assert.deepEqual(result, [4, 5]);
});

test("no change", () => {
  const changes = diffArray([1, 2, 3], [1, 2, 3]);
  assert(!changes);
});

test("remove a bookmark", () => {
  const before = [
    {title: "A", url: "a"},
    {title: "B", url: "b"},
    {title: "C", url: "c"},
  ];
  const after = [
    {title: "A", url: "a"},
    {title: "C", url: "c"},
  ];
  const remote = [
    {title: "A", url: "X"},
    {title: "B", url: "b"},
    {title: "C", url: "c"},
  ]
  const expected = [
    {title: "A", url: "X"},
    {title: "C", url: "c"},
  ];
  const changes = diffArray(before, after);
  const result = applyArrayDiff(remote, changes);
  assert.deepEqual(result, expected);
});

test("remove a modified bookmark", {skip: true}, () => {
  const before = [
    {title: "A", url: "a"},
    {title: "B", url: "b"},
    {title: "C", url: "c"},
  ];
  const after = [
    {title: "A", url: "a"},
    {title: "C", url: "c"},
  ];
  const remote = [
    {title: "A", url: "a"},
    {title: "B", url: "X"},
    {title: "C", url: "c"},
  ]
  const expected = [
    {title: "A", url: "a"},
    {title: "C", url: "c"},
  ];
  const changes = diffArray(before, after);
  const result = applyArrayDiff(remote, changes);
  assert.deepEqual(result, expected);
});

test("add a bookmark", () => {
  const before = [
    {title: "A", url: "a"},
    {title: "C", url: "c"},
  ];
  const after = [
    {title: "A", url: "a"},
    {title: "B", url: "b"},
    {title: "C", url: "c"},
  ];
  const remote = [
    {title: "A", url: "X"},
    {title: "C", url: "c"},
  ]
  const expected = [
    {title: "A", url: "X"},
    {title: "B", url: "b"},
    {title: "C", url: "c"},
  ];
  const changes = diffArray(before, after);
  const result = applyArrayDiff(remote, changes);
  assert.deepEqual(result, expected);
});

test("add a bookmark while new remote", () => {
  const before = [
    {title: "A", url: "a"},
    {title: "C", url: "c"},
  ];
  const after = [
    {title: "A", url: "a"},
    {title: "B", url: "b"},
    {title: "C", url: "c"},
  ];
  const remote = [
    {title: "O", url: "o"},
    {title: "A", url: "a"},
    {title: "C", url: "c"},
  ]
  const expected = [
    {title: "O", url: "o"},
    {title: "A", url: "a"},
    {title: "B", url: "b"},
    {title: "C", url: "c"},
  ];
  const changes = diffArray(before, after);
  const result = applyArrayDiff(remote, changes);
  assert.deepEqual(result, expected);
});

test("no delete", () => {
  // const before = [
  //   {title: "A", url: "a"},
  //   {title: "B", url: "b"},
  //   {title: "C", url: "c"},
  // ];
  const local = [
    {title: "A", url: "u"},
    {title: "C", url: "c"},
    {title: "D", url: "d"},
  ];
  const remote = [
    {title: "A", url: "a"},
    {title: "B", url: "X"},
    {title: "C", url: "c"},
  ]
  const expected = [
    {title: "A", url: "u"},
    {title: "B", url: "X"},
    {title: "C", url: "c"},
    {title: "D", url: "d"},
  ];
  const changes = diffArray(remote, local, {noDelete: true});
  const result = applyArrayDiff(remote, changes);
  assert.deepEqual(result, expected);
});

test("no delete doesn't work well with large modification", () => {
  const local = [
    {title: "A", url: "u"},
    {title: "C", url: "c"},
  ];
  const remote = [
    {title: "B", url: "b"},
    {title: "D", url: "d"},
  ]
  const expected = [
    {title: "A", url: "u"},
    {title: "C", url: "c"},
  ];
  const changes = diffArray(remote, local, {noDelete: true});
  const result = applyArrayDiff(remote, changes);
  assert.deepEqual(result, expected);
})

test("no delete + isAtomic", () => {
  const local = [
    {title: "A", url: "u"},
    {title: "C", url: "c"},
    {title: "G", url: "g"},
  ];
  const remote = [
    {title: "B", url: "b"},
    {title: "D", url: "d"},
    {title: "G", url: "g"},
  ]
  const expected = [
    {title: "B", url: "b"},
    {title: "A", url: "u"},
    {title: "D", url: "d"},
    {title: "C", url: "c"},
    {title: "G", url: "g"},
  ];
  const changes = diffArray(remote, local, {noDelete: true, isAtomic: obj => obj.title && obj.url && !obj.children});
  const result = applyArrayDiff(remote, changes);
  assert.deepEqual(result, expected);
})
