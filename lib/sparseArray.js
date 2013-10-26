if (typeof define !== 'function') {
	var define = require('amdefine')(module);
}
define(function(undefined) {
	'use strict';

	function SparseArray() {
		var root = empty;
		this.isEmpty = function() {
			return isEmpty(root);
		};
		this.get = function(index) {
			return get(root, index);
		};
		this.hasBefore = function(index) {
			return hasBefore(root, index);
		};
		this.getBefore = function(index) {
			return getBefore(root, index);
		};
		this.set = function(index, value) {
			root = set(root, index, value);
		};
		this.remove = function(index) {
			root = remove(root, index);
		};
		this.each = function(f) {
			return each(root, f);
		};
		this.eachAfter = function(index, f) {
			return eachAfter(root, index, f);
		};
	}

	var branchTag = 0;
	var leafTag = 1;
	var emptyTag = 2;

	function Node() {}

	Node.prototype.tag = emptyTag;

	function isEmpty(node) {
		return node === empty;
	}

	function get(node, index) {
		switch (node.tag) {
		case branchTag:
			if (!hasPrefix(index, node.prefix, node.mask)) {
				return undefined;
			}
			if (zero(index, node.mask)) {
				return get(node.left, index);
			}
			return get(node.right, index);
		case leafTag:
			return index === node.index? node.value : undefined;
		case emptyTag:
			return undefined;
		}
	}

	function hasBefore(node, index) {
		if (node.tag === branchTag && node.mask < 0) {
			return index >= 0?
				go(node.right, node.left) :
				go(empty, node.right);
		}
		return go(empty, node);

		function go(first, node) {
			switch (node.tag) {
			case branchTag:
				if (!hasPrefix(index, node.prefix, node.mask)) {
					return !isEmpty(index < node.prefix? first : node.right);
				}
				if (zero(index, node.mask)) {
					return go(first, node.left);
				}
				return go(node.left, node.right);
			case leafTag:
				return index <= node.index?
					!isEmpty(first) :
					true;
			case emptyTag:
				return !isEmpty(first);
			}
		}
	}

	function getBefore(node, index) {
		if (node.tag === branchTag && node.mask < 0) {
			return index >= 0?
				go(node.right, node.left) :
				go(empty, node.right);
		}
		return go(empty, node);

		function go(first, node) {
			switch (node.tag) {
			case branchTag:
				if (!hasPrefix(index, node.prefix, node.mask)) {
					return index < node.prefix?
						unsafeGetLast(first) :
						unsafeGetLast(node.right);
				}
				if (zero(index, node.mask)) {
					return go(first, node.left);
				}
				return go(node.left, node.right);
			case leafTag:
				return index <= node.index?
					unsafeGetLast(first) :
					node.value;
			case emptyTag:
				return unsafeGetLast(first);
			}
		}
	}

	function unsafeGetLast(node) {
		switch (node.tag) {
		case branchTag:
			return unsafeGetLast(node.right);
		case leafTag:
			return node.value;
		case emptyTag:
			return undefined;
		}
	}

	function set(node, index, value) {
		switch (node.tag) {
		case branchTag:
			if (!hasPrefix(index, node.prefix, node.mask)) {
				return makeBranch(index, newLeaf(index, value), node.prefix, node);
			}
			if (zero(index, node.mask)) {
				node.left = set(node.left, index, value);
			} else {
				node.right = set(node.right, index, value);
			}
			return node;
		case leafTag:
			if (index === node.index) {
				node.value = value;
				return node;
			}
			return makeBranch(index, newLeaf(index, value), node.index, node);
		case emptyTag:
			return newLeaf(index, value);
		}
	}

	function remove(node, index) {
		switch (node.tag) {
		case branchTag:
			if (!hasPrefix(index, node.prefix, node.mask)) {
				return node;
			}
			if (zero(index, node.mask)) {
				var left = remove(node.left, index);
				if (left === empty) {
					return node.right;
				}
				node.left = left;
				return node;
			}
			var right = remove(node.right, index);
			if (right === empty) {
				return node.left;
			}
			node.right = right;
			return node;
		case leafTag:
			if (index === node.index) {
				return empty;
			}
			return node;
		case emptyTag:
			return node;
		}
	}

	function each(node, f) {
		if (node.tag === branchTag && node.mask < 0) {
			go(node.right);
			go(node.left);
		} else {
			go(node);
		}

		function go(node) {
			switch (node.tag) {
			case branchTag:
				go(node.left);
				go(node.right);
				break;
			case leafTag:
				f(node.value, node.index);
				break;
			case emptyTag:
				break;
			}
		}
	}

	function eachAfter(node, index, f) {
		if (node.tag === branchTag && node.mask < 0) {
			if (index >= 0) {
				go(node.left);
			} else {
				go(node.right);
				each(node.left, f);
			}
		} else {
			go(node);
		}

		function go(node) {
			switch (node.tag) {
			case branchTag:
				if (!hasPrefix(index, node.prefix, node.mask)) {
					if (index < node.prefix) {
						each(node, f);
					}
				} else if (zero(index, node.mask)) {
					go(node.left);
					each(node.right, f);
				} else {
					go(node.right);
				}
				break;
			case leafTag:
				if (index < node.index) {
					f(node.value, node.index);
				}
				break;
			case emptyTag:
				break;
			}
		}
	}

	function makeBranch(prefix1, node1, prefix2, node2) {
		var mask = makeMask(prefix1, prefix2);
		var prefix = makePrefix(prefix1, mask);
		return zero(prefix1, mask)?
			newBranch(prefix, mask, node1, node2) :
			newBranch(prefix, mask, node2, node1);
	}

	function newBranch(prefix, mask, left, right) {
		var node = new Node();
		node.tag = branchTag;
		node.prefix = prefix;
		node.mask = mask;
		node.left = left;
		node.right = right;
		return node;
	}

	function newLeaf(index, value) {
		var node = new Node();
		node.tag = leafTag;
		node.index = index;
		node.value = value;
		return node;
	}

	var empty = new Node();

	function hasPrefix(index, prefix, mask) {
		return makePrefix(index, mask) === prefix;
	}

	function zero(index, mask) {
		return (index & mask) === 0;
	}

	function makePrefix(index, mask) {
		return index & (~(mask - 1) ^ mask);
	}

	function makeMask(prefix1, prefix2) {
		return greatestPowerOfTwo(prefix1 ^ prefix2);
	}

	function greatestPowerOfTwo(value) {
		value |= value >> 1;
		value |= value >> 2;
		value |= value >> 4;
		value |= value >> 8;
		value |= value >> 16;
		value ^= value >>> 1;
		return value;
	}

	return SparseArray;
});
