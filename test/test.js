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
  console.log(changes);
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
