import treeDiffer from "treediffer";

import {builtinIds, NATIVE_ID, USER_AGENT} from "./env.js";

const OP_CHANGE = Symbol();
const OP_INSERT_AFTER = Symbol();
const OP_INSERT_CHILD = Symbol();
const OP_REMOVE = Symbol();
const OP_MOVE_FROM = Symbol();
const OP_MOVE_TO = Symbol();
const ORIGIN = Symbol();
const CORRESPONDS = Symbol();

export function diffBookmarkData(data1, data2) {
  // only diff supported categories
  const keys = Object.keys(builtinIds).filter(key => builtinIds[key][USER_AGENT] != null);

  const root1 = makeRoot(data1, keys);
  const root2 = makeRoot(data2, keys);

  const tree1 = new treeDiffer.Tree(root1, BookmarkTreeNode);
  const tree2 = new treeDiffer.Tree(root2, BookmarkTreeNode);

  const differ = new treeDiffer.Differ(tree1, tree2);
  const trans = differ.transactions[tree1.orderedNodes.length - 1][tree2.orderedNodes.length - 1];
  const op = differ.getCorrespondingNodes(trans, tree1.orderedNodes.length, tree2.orderedNodes.length);
  return {trans, op, tree1, tree2, size: trans.length};
}

export function generatePatch(transArr) {
  for (let i = 1; i < transArr.length; i++) {
    if (transArr[i].tree1 !== transArr[0].tree1) {
      throw new Error("All transactions must share the same tree1");
    }
  }
  for (const trans of transArr) {
    annotateTransaction(trans);
  }
  return transArr[0].tree1.root.node;
}

export function applyPatch(root) {

}

function annotateTransaction(trans) {
  // collect moves
  const moved = [];
  trans.op.moved = moved;
  for (let i = 0; i < trans.op.remove.length; i++) {
    const leftIndex = trans.op.remove[i];
    for (let j = 0; j < trans.op.insert.length; j++) {
      const rightIndex = trans.op.insert[j];
      const fromNode = trans.tree1.orderedNodes[leftIndex];
      const toNode = trans.tree2.orderedNodes[rightIndex];
      if (fromNode.isEqual(toNode)) {
        moved.push([leftIndex, rightIndex]);
        trans.op.insert.splice(j, 1);
        trans.op.remove.splice(i, 1);
        i--;
        break;
      }
    }
  }
  // annotate changes
  for (const [i, j] of Object.entries(trans.op.change)) {
    const n1 = trans.tree1.orderedNodes[i].node;
    const n2 = trans.tree2.orderedNodes[j].node;
    if (!n1[OP_CHANGE]) {
      n1[OP_CHANGE] = n2;
      n2[OP_CHANGE] = n1;
    } else {
      // when there are multiple changes to the same node, treat second change as insert
      if (!n1[OP_INSERT_AFTER]) {
        n1[OP_INSERT_AFTER] = [];
      }
      n1[OP_INSERT_AFTER].push(n2);
    }
  }
  // annotate removes
  for (const i of trans.op.remove) {
    const n = trans.tree1.orderedNodes[i].node
    n[OP_REMOVE] = true;
  }
  // annotate inserts
  for (const i of trans.op.insert) {
    const treeNode = trans.tree2.orderedNodes[i];
    annotateInsert(treeNode);
  }
  // annotate moves
  for (const [fromIndex, toIndex] of moved) {
    let fromData = trans.tree1.orderedNodes[fromIndex].node;
    const toNode = trans.tree2.orderedNodes[toIndex];
    const toData = toNode.node;
    // resolve move chain
    while (fromData[OP_MOVE_TO]) {
      fromData = fromData[OP_MOVE_TO];
    }
    fromData[OP_MOVE_TO] = toData;
    toData[OP_MOVE_FROM] = fromData;
    // insert
    annotateInsert(toNode, trans);
  }
}

function annotateOrigin(node, trans) {
  const leftIndex = trans.op.newToOld[node.index];
  const data = node.node;
  if (leftIndex !== undefined) {
    const leftData = trans.tree1.orderedNodes[leftIndex].node;
    data[ORIGIN] = leftData;
    if (!leftData[CORRESPONDS]) {
      leftData[CORRESPONDS] = [];
    }
    // NOTE: corresponds may contain duplicates, make sure to filter out later.
    leftData[CORRESPONDS].push(data);
  }
}

function annotateInsert(node, trans) {
  calculatePrev(node);
  if (node.prev) {
    annotateOrigin(node.prev, trans);
    const preData = node.prev.node;
    if (!preData[OP_INSERT_AFTER]) {
      preData[OP_INSERT_AFTER] = [];
    }
    preData[OP_INSERT_AFTER].push(node.node);
  } else {
    annotateOrigin(node.parent, trans);
    const parentData = node.parent.node;
    if (!parentData[OP_INSERT_CHILD]) {
      parentData[OP_INSERT_CHILD] = [];
    }
    parentData[OP_INSERT_CHILD].push(node.node);
  }
}

function calculatePrev(node) {
  const parent = node.parent;
  if (parent.children.length >= 2 && parent.children[1].prev) {
    return;
  }
  for (let i = 1; i < parent.children.length; i++) {
    parent.children[i].prev = parent.children[i - 1];
  }
}

function makeRoot(data, keys) {
  return {
    type: "root",
    children: keys.map(key => ({
      type: "category",
      id: key,
      [NATIVE_ID]: builtinIds[key][USER_AGENT],
      children: data[key] || []
    }))
  };
}

class BookmarkTreeNode extends treeDiffer.TreeNode {
  getOriginalNodeChildren() {
    return this.node.children || [];
  }
  isEqual(otherNode) {
    if (this.node.type !== otherNode.node.type) return false;
    if (this.node.type === "category") {
      return this.node.id === otherNode.node.id;
    } else if (this.node.type === "bookmark") {
      return this.node.url === otherNode.node.url && this.node.title === otherNode.node.title;
    } else if (this.node.type === "folder") {
      return this.node.title === otherNode.node.title;
    }
    return true;
  }
}
