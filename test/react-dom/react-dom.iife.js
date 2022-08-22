"use strict";
var ReactDOM = (() => {
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

  // packages/shared/src/utils.ts
  function isString(value) {
    return typeof value === "string";
  }
  function isFunction(value) {
    return typeof value === "function";
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
  var TAG_CLASS_COMPONENT = Symbol.for("TAG_CLASS_COMPONENT");
  var TAG_FUNCTION_COMPONENT = Symbol.for("TAG_FUNCTION_COMPONENT");

  // packages/types/src/effectType.ts
  var PLACEMENT = Symbol.for("PLACEMENT");
  var UPDATE = Symbol.for("UPDATE");
  var DELETION = Symbol.for("DELETION");

  // packages/react/src/updater.ts
  var UpdaterQueue = class {
    firstUpdater = null;
    lastUpdater = null;
    enqueueUpdate(updater) {
      if (this.lastUpdater === null) {
        this.firstUpdater = this.lastUpdater = updater;
      } else {
        this.lastUpdater.nextUpdater = updater;
        this.lastUpdater = updater;
      }
    }
    forceUpdate(state) {
      let currentUpdater = this.firstUpdater;
      while (currentUpdater) {
        const nextState = isFunction(currentUpdater.payload) ? currentUpdater.payload(state) : currentUpdater.payload;
        state = { ...state, ...nextState };
        currentUpdater = currentUpdater.nextUpdater;
      }
      this.firstUpdater = this.lastUpdater = null;
      return state;
    }
  };

  // packages/react/src/scheduler.ts
  var workInProgressRoot = null;
  var nextUnitOfWork = null;
  var currentRoot = null;
  var deletions = [];
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
    deletions.forEach(commitWork);
    let currentFiber = workInProgressRoot.firstEffect;
    while (currentFiber) {
      commitWork(currentFiber);
      currentFiber = currentFiber.nextEffect;
    }
    deletions.length = 0;
    currentRoot = workInProgressRoot;
    workInProgressRoot = null;
  }
  function commitWork(currentFiber) {
    if (!currentFiber)
      return;
    const {
      tag,
      effectTag,
      stateNode,
      props,
      type,
      children,
      alternate
    } = currentFiber;
    let parentFiber = currentFiber.parent;
    while (parentFiber.tag !== TAG_ELEMENT && parentFiber.tag !== TAG_ROOT && parentFiber.tag !== TAG_TEXT) {
      parentFiber = parentFiber.parent;
    }
    const parentNode = parentFiber.stateNode;
    if (effectTag === PLACEMENT) {
      let nextFiber = currentFiber;
      while (nextFiber.tag !== TAG_ELEMENT && nextFiber.tag !== TAG_TEXT) {
        nextFiber = currentFiber.child;
      }
      parentNode.appendChild(nextFiber.stateNode);
    } else if (effectTag === DELETION) {
      commitDeletion(currentFiber, parentNode);
    } else if (effectTag === UPDATE) {
      if (type === TEXT && children !== alternate.children) {
        stateNode.textContent = children;
      } else if (tag !== TAG_CLASS_COMPONENT) {
        updateDOM(stateNode, alternate.props, props);
      }
    }
    currentFiber.effectTag = null;
  }
  function commitDeletion(currentFiber, parentNode) {
    if (currentFiber.tag === TAG_ELEMENT && currentFiber.tag === TAG_TEXT) {
      parentNode.removeChild(currentFiber.stateNode);
    } else {
      commitDeletion(currentFiber.child, parentNode);
    }
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
    } else if (tag === TAG_CLASS_COMPONENT) {
      updateClassComponent(currentFiber);
    } else if (tag === TAG_FUNCTION_COMPONENT) {
      updateFunctionComponent(currentFiber);
    }
  }
  function updateFunctionComponent(currentFiber) {
  }
  function updateClassComponent(currentFiber) {
    if (!currentFiber.stateNode) {
      currentFiber.stateNode = new currentFiber.type(currentFiber.props);
      currentFiber.stateNode.internalFiber = currentFiber;
      currentFiber.updaterQueue = new UpdaterQueue();
    }
    currentFiber.stateNode.state = currentFiber.updaterQueue.forceUpdate(currentFiber.stateNode.state);
    const newElement = currentFiber.stateNode.render();
    const newChildren = [newElement];
    reconcileChildren(currentFiber, newChildren);
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
    let oldFiber = currentFiber.alternate && currentFiber.alternate.child;
    if (oldFiber) {
      oldFiber.firstEffect = oldFiber.lastEffect = oldFiber.nextEffect = null;
    }
    let prevSibling;
    while (childrenIndex < children.length) {
      const newChild = children[childrenIndex++];
      const sameType = oldFiber && newChild && oldFiber.type === newChild.type;
      let newFiber;
      if (sameType) {
        if (oldFiber.alternate) {
          newFiber = oldFiber.alternate;
          newFiber.props = newChild.props;
          newFiber.children = newChild.children;
          newFiber.alternate = oldFiber;
          newFiber.effectTag = UPDATE;
          newFiber.updaterQueue = oldFiber.updaterQueue || new UpdaterQueue();
          newFiber.nextEffect = null;
        } else {
          newFiber = {
            tag: oldFiber.tag,
            type: oldFiber.type,
            props: newChild.props,
            children: newChild.children,
            stateNode: oldFiber.stateNode,
            parent: currentFiber,
            updaterQueue: oldFiber.updaterQueue || new UpdaterQueue(),
            alternate: oldFiber,
            effectTag: UPDATE,
            nextEffect: null
          };
        }
      } else if (newChild) {
        let tag;
        if (newChild && isFunction(newChild.type)) {
          tag = newChild.type.prototype.isReactComponent ? TAG_CLASS_COMPONENT : TAG_FUNCTION_COMPONENT;
        } else if (newChild.type === TEXT) {
          tag = TAG_TEXT;
        } else if (isString(newChild.type)) {
          tag = TAG_ELEMENT;
        } else {
          tag = TAG_COMMENT;
        }
        newFiber = {
          tag,
          type: newChild.type,
          props: newChild.props,
          children: newChild.children,
          stateNode: null,
          parent: currentFiber,
          effectTag: PLACEMENT,
          updaterQueue: new UpdaterQueue(),
          nextEffect: null
        };
      } else if (oldFiber) {
        oldFiber.effectTag = DELETION;
        deletions.push(oldFiber);
      }
      if (oldFiber) {
        oldFiber = oldFiber.sibling;
      }
      if (childrenIndex === 1) {
        currentFiber.child = newFiber;
      } else {
        prevSibling.sibling = newFiber;
      }
      prevSibling = newFiber;
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
    if (currentRoot && currentRoot.alternate) {
      workInProgressRoot = currentRoot.alternate;
      workInProgressRoot.alternate = currentRoot;
      if (rootFiber) {
        workInProgressRoot.props = rootFiber.props;
        workInProgressRoot.children = rootFiber.children;
      }
    } else if (currentRoot) {
      if (rootFiber) {
        rootFiber.alternate = currentRoot;
        workInProgressRoot = rootFiber;
      } else {
        workInProgressRoot = {
          ...currentRoot,
          alternate: currentRoot
        };
      }
    } else {
      workInProgressRoot = rootFiber;
    }
    workInProgressRoot.firstEffect = workInProgressRoot.lastEffect = workInProgressRoot.nextEffect = null;
    nextUnitOfWork = workInProgressRoot;
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
  return __toCommonJS(react_dom_exports);
})();
//# sourceMappingURL=react-dom.iife.js.map
