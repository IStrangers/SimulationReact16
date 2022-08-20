"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// packages/react/index.ts
var react_exports = {};
__export(react_exports, {
  createElement: () => createElement
});
module.exports = __toCommonJS(react_exports);

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createElement
});
//# sourceMappingURL=react.cjs.js.map
