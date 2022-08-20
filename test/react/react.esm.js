// packages/shared/src/utils.ts
function isObject(value) {
  return typeof value === "object";
}
function isFunction(value) {
  return typeof value === "function";
}

// packages/types/src/nodeType.ts
var TEXT = Symbol.for("TEXT");
var TAG_ROOT = Symbol.for("TAG_ROOT");
var TAG_ELEMENT = Symbol.for("TAG_ELEMENT");
var TAG_TEXT = Symbol.for("TAG_TEXT");
var TAG_COMMENT = Symbol.for("TAG_COMMENT");

// packages/types/src/effectType.ts
var PLACEMENT = Symbol.for("PLACEMENT");
var UPDATE = Symbol.for("PLACEMENT");
var DELETION = Symbol.for("PLACEMENT");

// packages/react/index.ts
function createElement(type, config, ...children) {
  return {
    type,
    props: {
      ...config
    },
    children: children.map((child) => {
      if (isObject(child) || isFunction(child)) {
        return child;
      }
      return {
        type: TEXT,
        props: {},
        children: child
      };
    })
  };
}
export {
  createElement
};
//# sourceMappingURL=react.esm.js.map
