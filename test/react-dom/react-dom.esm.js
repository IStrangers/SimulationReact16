// packages/shared/src/utils.ts
function isArray(value) {
  return Array.isArray(value);
}
function isFunction(value) {
  return typeof value === "function";
}
function onlyOne(items) {
  return isArray(items) ? items[0] : items;
}
function flatten(array) {
  const flatted = [];
  function flat(items) {
    items.forEach((item) => {
      if (isArray(item)) {
        flat(item);
      } else {
        flatted.push(item);
      }
    });
  }
  flat(array);
  return flatted;
}

// packages/react/src/updater.ts
var UpdaterQueue = class {
  updaters = [];
  isPending = false;
  add(updater) {
    this.updaters.push(updater);
  }
  batchUpdate() {
    let updater;
    while (updater = this.updaters.pop()) {
      updater.updateComponent();
    }
    this.isPending = false;
  }
};
var updaterQueue = new UpdaterQueue();
function batchedUpdates(fn) {
  updaterQueue.isPending = true;
  fn();
  updaterQueue.isPending = false;
  updaterQueue.batchUpdate();
}

// packages/react/src/event.ts
function addEventListener(dom, eventType, listener) {
  eventType = eventType.toLowerCase();
  const eventStore = dom["eventStore"] || (dom["eventStore"] = {});
  eventStore[eventType] = listener;
  document.addEventListener(eventType.slice(2), dispatchEvent, false);
}
var syntheticEvent = null;
function dispatchEvent(event) {
  let { type, target } = event;
  const eventType = `on${type}`;
  syntheticEvent = getSyntheticEvent(event);
  updaterQueue.isPending = true;
  while (target) {
    const eventStore = target["eventStore"];
    const listener = eventStore && eventStore[eventType];
    if (listener) {
      listener.call(target, syntheticEvent);
    }
    target = target["parentNode"];
  }
  for (let key in syntheticEvent) {
    syntheticEvent[key] = void 0;
  }
  updaterQueue.isPending = false;
  updaterQueue.batchUpdate();
}
var SyntheticEvent = class {
  persist() {
    syntheticEvent = null;
  }
};
function getSyntheticEvent(nativeEvent) {
  if (!syntheticEvent) {
    syntheticEvent = new SyntheticEvent();
  }
  syntheticEvent["nativeEvent"] = nativeEvent;
  for (let key in nativeEvent) {
    const value = nativeEvent[key];
    if (isFunction(value)) {
      syntheticEvent[key] = value.bind(nativeEvent);
    } else {
      syntheticEvent[key] = value;
    }
  }
  return syntheticEvent;
}

// packages/types/src/nodeType.ts
var TEXT = Symbol.for("TEXT");
var ELEMENT = Symbol.for("ELEMENT");
var CLASS_COMPONENT = Symbol.for("CLASS_COMPONENT");
var FUNCTION_COMPONENT = Symbol.for("FUNCTION_COMPONENT");

// packages/react/src/vdom.ts
function createDOM(element) {
  element = onlyOne(element);
  let dom;
  const { nodeType } = element;
  if (nodeType === TEXT) {
    dom = document.createTextNode(element.content);
  } else if (nodeType === ELEMENT) {
    dom = createNativeDOM(element);
  } else if (nodeType === CLASS_COMPONENT) {
    dom = createClassComponentDOM(element);
  } else if (nodeType === FUNCTION_COMPONENT) {
    dom = createFunctionComponentDOM(element);
  } else {
    dom = document.createComment(element.content ? element.content : "");
  }
  element.dom = dom;
  return dom;
}
function createNativeDOM(element) {
  const { type, ref, props, children } = element;
  const dom = document.createElement(type);
  ref && setRef(dom, ref);
  props && setProps(dom, props);
  children && createChildrenDOM(dom, children);
  return dom;
}
function setRef(current, ref) {
  if (ref) {
    ref.current = current;
  }
}
function createChildrenDOM(parentNode, children) {
  children && flatten(children).forEach((child, index) => {
    child["mountIndex"] = index;
    const childDOM = createDOM(child);
    parentNode.appendChild(childDOM);
  });
}
function setProps(dom, props) {
  for (let key in props) {
    setProp(dom, key, props[key]);
  }
}
function setProp(dom, key, value) {
  if (/^on/.test(key)) {
    addEventListener(dom, key, value);
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
function createClassComponentDOM(element) {
  const { type, ref, props } = element;
  const componentInstance = new type(props);
  setContext(componentInstance, type);
  setRef(componentInstance, ref);
  componentInstance.componentWillMount();
  const renderElement = componentInstance.render();
  const dom = createDOM(renderElement);
  renderElement.dom = dom;
  componentInstance.renderElement = renderElement;
  element.componentInstance = componentInstance;
  batchedUpdates(() => componentInstance.componentDidMount());
  componentInstance.isOverMount = true;
  return dom;
}
function setContext(componentInstance, classType) {
  if (classType.contextType) {
    componentInstance.context = classType.contextType.Provider.value;
  }
}
function createFunctionComponentDOM(element) {
  const { type, props } = element;
  const renderElement = type(props);
  const dom = createDOM(renderElement);
  renderElement.dom = dom;
  element.renderElement = renderElement;
  return dom;
}

// packages/react-dom/index.ts
function render(element, container) {
  const dom = createDOM(element);
  container.appendChild(dom);
}
export {
  render
};
//# sourceMappingURL=react-dom.esm.js.map
