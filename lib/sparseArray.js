if (typeof define !== 'function') {
	var define = require('amdefine')(module);
}
define(function(require, exports, module, undefined) {
	'use strict';

	function SparseArray() {
		var root = empty;
		this.isEmpty = function() {
			return isEmpty(root);
		};
		this.get = function(index) {
			return root.get(index);
		};
		this.hasBefore = function(index) {
			return root.hasBefore(empty, index);
		};
		this.getBefore = function(index) {
			return root.getBefore(empty, index);
		};
		this.set = function(index, value) {
			root = root.set(index, value);
		};
		this.remove = function(index) {
			root = root.remove(index);
		};
		this.each = function(f) {
			return root.each(f);
		};
		this.eachAfter = function(index, f) {
			return root.eachAfter(index, f);
		};
	}

	function Signed(left, right) {
		this.left = left;
		this.right = right;
	}

	function Unsigned(prefix, mask, left, right) {
		this.prefix = prefix;
		this.mask = mask;
		this.left = left;
		this.right = right;
	}

	function Leaf(index, value) {
		this.index = index;
		this.value = value;
	}

	var empty = {};

	function isEmpty(node) {
		return node === empty;
	}

	Signed.prototype.get = function(index) {
		return index < 0?
			this.left.get(index) :
			this.right.get(index);
	};
	Unsigned.prototype.get = function(index) {
		if (!hasPrefix(index, this.prefix, this.mask)) {
			return undefined;
		}
		if (zero(index, this.mask)) {
			return this.left.get(index);
		}
		return this.right.get(index);
	};
	Leaf.prototype.get = function(index) {
		return index === this.index? this.value : undefined;
	};
	empty.get = function() {
		return undefined;
	};

	Signed.prototype.hasBefore = function(first, index) {
		return index < 0?
			this.left.hasBefore(first, index) :
			this.right.hasBefore(this.left, index);
	};
	Unsigned.prototype.hasBefore = function(first, index) {
		if (!hasPrefix(index, this.prefix, this.mask)) {
			return !isEmpty(index < this.prefix? first : this.right);
		}
		if (zero(index, this.mask)) {
			return this.left.hasBefore(first, index);
		}
		return this.right.hasBefore(this.left, index);
	};
	Leaf.prototype.hasBefore = function(first, index) {
		return this.index < index?
			true :
			!isEmpty(first);
	};
	empty.hasBefore = function(first) {
		return isEmpty(first);
	};

	Signed.prototype.getBefore = function(first, index) {
		return index < 0?
			this.left.getBefore(first, index) :
			this.right.getBefore(this.left, index);
	};
	Unsigned.prototype.getBefore = function(first, index) {
		if (!hasPrefix(index, this.prefix, this.mask)) {
			return index < this.prefix?
				first.getLast() :
				this.right.getLast();
		}
		if (zero(index, this.mask)) {
			return this.left.getBefore(first, index);
		}
		return this.right.getBefore(first, index);
	};
	Leaf.prototype.getBefore = function(first, index) {
		return this.index < index?
			this.value :
			first.getLast();
	};
	empty.getBefore = function(first) {
		return first.getLast();
	};

	Signed.prototype.getLast = function() {
		return this.left.getLast();
	};
	Unsigned.prototype.getLast = function() {
		return this.left.getLast();
	};
	Leaf.prototype.getLast = function() {
		return this.value;
	};
	empty.getLast = function() {
		return undefined;
	};

	Signed.prototype.set = function(index, value) {
		if (index < 0) {
			this.left = this.left.set(index, value);
		} else {
			this.right = this.right.set(index, value);
		}
		return this;
	};
	Unsigned.prototype.set = function(index, value) {
		if (!hasPrefix(index, this.prefix, this.mask)) {
			return newBranch(index, new Leaf(index, value), this.prefix, this);
		}
		if (zero(index, this.mask)) {
			this.left = this.left.set(index, value);
		} else {
			this.right = this.right.set(index, value);
		}
		return this;
	};
	Leaf.prototype.set = function(index, value) {
		if (this.index === index) {
			this.value = value;
			return this;
		}
		return newBranch(index, new Leaf(index, value), this.index, this);
	};
	empty.set = function(index, value) {
		return new Leaf(index, value);
	};

	Signed.prototype.remove = function(index) {
		if (index < 0) {
			var left = this.left.remove(index);
			if (isEmpty(left)) {
				return this.right;
			}
			this.left = left;
		} else {
			var right = this.right.remove(index);
			if (isEmpty(right)) {
				return this.left;
			}
			this.right = right;
		}
		return this;
	};
	Unsigned.prototype.remove = function(index) {
		if (!hasPrefix(index, this.prefix, this.mask)) {
			return this;
		}
		if (zero(index, this.mask)) {
			var left = this.left.remove(index);
			if (isEmpty(left)) {
				return this.right;
			}
			this.left = left;
		} else {
			var right = this.right.remove(index);
			if (isEmpty(right)) {
				return this.left;
			}
			this.right = right;
		}
		return this;
	};
	Leaf.prototype.remove = function(index) {
		return this.index === index? empty : this;
	};
	empty.remove = function() {
		return this;
	};

	Signed.prototype.each = function(f) {
		this.left.each(f);
		this.right.each(f);
	};
	Unsigned.prototype.each = function(f) {
		this.left.each(f);
		this.right.each(f);
	};
	Leaf.prototype.each = function(f) {
		f(this.value, this.index);
	};
	empty.each = function() {};

	Signed.prototype.eachAfter = function(index, f) {
		if (index < 0) {
			this.left.eachAfter(index, f);
			this.right.each(f);
		} else {
			this.right.eachAfter(index, f);
		}
	};
	Unsigned.prototype.eachAfter = function(index, f) {
		if (!hasPrefix(index, this.prefix, this.mask)) {
			if (index < this.prefix) {
				this.each(f);
			}
		} else if (zero(index, this.mask)) {
			this.left.eachAfter(index, f);
			this.right.each(f);
		} else {
			this.right.eachAfter(index, f);
		}
	};
	Leaf.prototype.eachAfter = function(index, f) {
		if (index < this.index) {
			f(this.value, this.index);
		}
	};
	empty.eachAfter = function() {};

	function newBranch(prefix1, node1, prefix2, node2) {
		var mask = makeMask(prefix1, prefix2);
		var prefix = makePrefix(prefix1, mask);
		if (mask < 0) {
			return prefix1 < 0?
				new Signed(node1, node2) :
				new Signed(node2, node1);
		}
		return zero(prefix1, mask)?
			new Unsigned(prefix, mask, node1, node2) :
			new Unsigned(prefix, mask, node2, node1);
	}

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
