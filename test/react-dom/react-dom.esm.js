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
var UPDATE = Symbol.for("UPDATE");
var DELETION = Symbol.for("DELETION");

// packages/react/src/schedule.ts
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
    parent: parentFiber,
    effectTag,
    stateNode,
    props,
    type,
    children,
    alternate
  } = currentFiber;
  const parentNode = parentFiber.stateNode;
  if (effectTag === PLACEMENT) {
    parentNode.appendChild(stateNode);
  } else if (effectTag === DELETION) {
    parentNode.removeChild(stateNode);
  } else if (effectTag === UPDATE) {
    if (type === TEXT && children !== alternate.children) {
      stateNode.textContent = children;
    } else {
      updateDOM(stateNode, alternate.props, props);
    }
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
  let oldFiber = currentFiber.alternate && currentFiber.alternate.child;
  let prevSibling;
  while (childrenIndex < children.length) {
    const newChild = children[childrenIndex++];
    const sameType = oldFiber && newChild && oldFiber.type === newChild.type;
    let newFiber;
    if (sameType) {
      newFiber = {
        tag: oldFiber.tag,
        type: oldFiber.type,
        props: newChild.props,
        children: newChild.children,
        stateNode: oldFiber.stateNode,
        parent: currentFiber,
        alternate: oldFiber,
        effectTag: UPDATE,
        nextEffect: null
      };
    } else if (newChild) {
      let tag;
      if (newChild.type === TEXT) {
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
    workInProgressRoot.props = rootFiber.props;
    workInProgressRoot.children = rootFiber.children;
    workInProgressRoot.alternate = currentRoot;
  } else if (currentRoot) {
    rootFiber.alternate = currentRoot;
    workInProgressRoot = rootFiber;
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
export {
  render
};
//# sourceMappingURL=react-dom.esm.js.map
