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

// packages/react-dom/index.ts
var react_dom_exports = {};
__export(react_dom_exports, {
  render: () => render
});
module.exports = __toCommonJS(react_dom_exports);

// packages/shared/src/utils.ts
function isString(value) {
  return typeof value === "string";
}
function hasOwnProperty(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
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

// packages/react/src/schedule.ts
var workInProgressRoot = null;
var nextUnitOfWork = null;
var currentRoot = null;
function startWork() {
  requestIdleCallback(workLoop, { timeout: 500 });
}
startWork();
function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  if (!nextUnitOfWork && workInProgressRoot) {
    commitRoot();
  }
  startWork();
}
function commitRoot() {
  let currentFiber = workInProgressRoot.firstEffect;
  while (currentFiber) {
    commitWork(currentFiber);
    currentFiber = currentFiber.nextEffect;
  }
  currentRoot = workInProgressRoot;
  workInProgressRoot = null;
}
function commitWork(currentFiber) {
  if (!currentFiber)
    return;
  const parentFiber = currentFiber.parent;
  const parentNode = parentFiber.stateNode;
  if (currentFiber.effectTag === PLACEMENT) {
    parentNode.appendChild(currentFiber.stateNode);
  }
  currentFiber.effectTag = null;
}
function performUnitOfWork(currentFiber) {
  beginWork(currentFiber);
  if (currentFiber.child) {
    return currentFiber.child;
  }
  while (currentFiber) {
    completeUnitOfWork(currentFiber);
    if (currentFiber.sibling) {
      return currentFiber.sibling;
    }
    currentFiber = currentFiber.parent;
  }
}
function completeUnitOfWork(currentFiber) {
  const { parent: parentFiber, effectTag } = currentFiber;
  if (parentFiber) {
    if (!parentFiber.firstEffect) {
      parentFiber.firstEffect = currentFiber.firstEffect;
    }
    if (currentFiber.lastEffect) {
      if (parentFiber.lastEffect) {
        parentFiber.lastEffect.nextEffect = currentFiber.firstEffect;
      }
      parentFiber.lastEffect = currentFiber.lastEffect;
    }
    if (effectTag) {
      if (parentFiber.lastEffect) {
        parentFiber.lastEffect.nextEffect = currentFiber;
      } else {
        parentFiber.firstEffect = currentFiber;
      }
      parentFiber.lastEffect = currentFiber;
    }
  }
}
function beginWork(currentFiber) {
  const { tag } = currentFiber;
  if (tag === TAG_ROOT) {
    updateHostRoot(currentFiber);
  } else if (tag === TAG_TEXT) {
    updateHostText(currentFiber);
  } else if (tag === TAG_ELEMENT) {
    updateHostElement(currentFiber);
  }
}
function updateHostElement(currentFiber) {
  if (!currentFiber.stateNode) {
    currentFiber.stateNode = createDOM(currentFiber);
  }
  const children = currentFiber.children;
  reconcileChildren(currentFiber, children);
}
function updateHostText(currentFiber) {
  if (!currentFiber.stateNode) {
    currentFiber.stateNode = createDOM(currentFiber);
  }
}
function updateHostRoot(currentFiber) {
  const children = currentFiber.children;
  reconcileChildren(currentFiber, children);
}
function reconcileChildren(currentFiber, children) {
  let childrenIndex = 0;
  let prevSibling;
  while (childrenIndex < children.length) {
    const child = children[childrenIndex++];
    let tag;
    if (child.type === TEXT) {
      tag = TAG_TEXT;
    } else if (isString(child.type)) {
      tag = TAG_ELEMENT;
    } else {
      tag = TAG_COMMENT;
    }
    const childFiber = {
      tag,
      type: child.type,
      props: child.props,
      children: child.children,
      stateNode: null,
      parent: currentFiber,
      effectTag: PLACEMENT,
      nextEffect: null
    };
    if (childrenIndex === 1) {
      currentFiber.child = childFiber;
    } else {
      prevSibling.sibling = childFiber;
    }
    prevSibling = childFiber;
  }
}
function createDOM(currentFiber) {
  const { tag } = currentFiber;
  if (tag === TAG_TEXT) {
    return document.createTextNode(currentFiber.children);
  } else if (tag == TAG_ELEMENT) {
    const dom = document.createElement(currentFiber.type);
    updateDOM(dom, {}, currentFiber.props);
    return dom;
  }
}
function updateDOM(dom, oldProps, newProps) {
  setProps(dom, oldProps, newProps);
}
function setProps(dom, oldProps, newProps) {
  for (let key in oldProps) {
    if (hasOwnProperty(newProps, key)) {
      dom.removeAttribute(key);
    }
  }
  for (let key in newProps) {
    setProp(dom, key, newProps[key]);
  }
}
function setProp(dom, key, value) {
  if (/^on/.test(key)) {
    dom[key.toLowerCase()] = value;
  } else if (key === "className") {
    dom.className = value;
  } else if (key === "style") {
    for (let styleName in value) {
      dom.style[styleName] = value[styleName];
    }
  } else {
    dom.setAttribute(key, value);
  }
}
function scheduleRoot(rootFiber) {
  workInProgressRoot = rootFiber;
  nextUnitOfWork = rootFiber;
}

// packages/react-dom/index.ts
function render(element, container) {
  const rootFiber = {
    tag: TAG_ROOT,
    stateNode: container,
    props: {},
    children: [element]
  };
  scheduleRoot(rootFiber);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  render
});
//# sourceMappingURL=react-dom.cjs.js.map
