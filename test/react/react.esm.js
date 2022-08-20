// packages/shared/src/utils.ts
function isObject(value) {
  return typeof value === "object";
}
function isString(value) {
  return typeof value === "string";
}
function isArray(value) {
  return Array.isArray(value);
}
function isFunction(value) {
  return typeof value === "function";
}
function hasOwnProperty(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
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

// packages/types/src/nodeType.ts
var TEXT = Symbol.for("TEXT");
var ELEMENT = Symbol.for("ELEMENT");
var CLASS_COMPONENT = Symbol.for("CLASS_COMPONENT");
var FUNCTION_COMPONENT = Symbol.for("FUNCTION_COMPONENT");

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
var Updater = class {
  constructor(componentInstance) {
    this.componentInstance = componentInstance;
    this.pendingState = [];
    this.nextProps = null;
  }
  pendingState;
  nextProps;
  addState(partialState) {
    this.pendingState.push(partialState);
    this.emitUpdate(null);
  }
  emitUpdate(nextProps) {
    this.nextProps = nextProps;
    if (nextProps || !updaterQueue.isPending) {
      this.updateComponent();
    } else {
      updaterQueue.add(this);
    }
  }
  updateComponent() {
    if (this.nextProps || this.pendingState.length > 0) {
      shouldUpdate(this.componentInstance, this.nextProps, this.getState());
    }
  }
  getState() {
    let state;
    if (this.pendingState.length > 0) {
      this.pendingState.forEach((nextState) => {
        if (isFunction(nextState)) {
          state = { ...this.componentInstance.state, ...nextState.call(this.componentInstance, this.componentInstance.state) };
        } else {
          state = { ...this.componentInstance.state, ...nextState };
        }
      });
    }
    this.pendingState.length = 0;
    return state;
  }
};
function shouldUpdate(componentInstance, nextProps, nextState) {
  componentInstance.props = nextProps;
  componentInstance.state = nextState;
  if (!componentInstance.isOverMount || !componentInstance.shouldComponentUpdate(nextProps, nextState)) {
    return false;
  }
  componentInstance.forceUpdate();
}
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

// packages/react/src/vdom.ts
function ReactElement(nodeType, type, key, ref, props, children) {
  const element = {
    nodeType,
    type,
    key,
    ref,
    props,
    children
  };
  return element;
}
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
function compareTwoElements(oldRenderElement, newRenderElement) {
  oldRenderElement = onlyOne(oldRenderElement);
  newRenderElement = onlyOne(newRenderElement);
  const currentDOM = oldRenderElement.dom;
  let currentElement = oldRenderElement;
  if (newRenderElement === null) {
    currentDOM.parentNode.removeChild(currentDOM);
  } else if (oldRenderElement.type !== newRenderElement.type) {
    const newDOM = createDOM(newRenderElement);
    currentDOM.parentNode.replaceChild(newDOM, currentDOM);
    currentElement = newRenderElement;
  } else {
    updateElement(oldRenderElement, newRenderElement);
  }
  return currentElement;
}
function updateElement(oldElement, newElement) {
  const currentDOM = newElement.dom = oldElement.dom;
  if (oldElement.nodeType === TEXT && newElement.nodeType === TEXT && oldElement.content !== newElement.content) {
    currentDOM.textContent = newElement.content;
  } else if (oldElement.nodeType === ELEMENT) {
    updateProps(currentDOM, oldElement.props, newElement.props);
    updateChildrenElement(currentDOM, oldElement.children, newElement.children);
    oldElement.props = newElement.props;
  } else if (oldElement.nodeType === CLASS_COMPONENT) {
    updateClassComponent(oldElement, newElement);
  } else if (oldElement.nodeType === FUNCTION_COMPONENT) {
    updateFunctionComponent(oldElement, newElement);
  }
}
function updateProps(dom, oldProps, newProps) {
  for (let key in oldProps) {
    if (hasOwnProperty(newProps, key)) {
      dom.removeAttribute(key);
    }
  }
  setProps(dom, newProps);
}
var updateDepth = 0;
var diffQueue = [];
function updateChildrenElement(dom, oldChildren, newChildren) {
  updateDepth++;
  diff(dom, oldChildren, newChildren);
  updateDepth--;
  if (updateDepth === 0) {
    patch();
  }
}
function diff(dom, oldChildren, newChildren) {
  const oldChildrenElementsMap = getChildrenElementsMap(oldChildren);
  const newChildrenElementsMap = getNewChildrenElementsMap(oldChildrenElementsMap, newChildren);
  let lastIndex = 0;
  for (let i = 0; i < newChildren.length; i++) {
    const newElement = newChildren[i];
    if (!newElement) {
      const oldElement2 = oldChildrenElementsMap[i.toString()];
      if (oldElement2.componentInstance) {
        oldElement2.componentInstance.componentWillUnmount();
      }
      continue;
    }
    const newKey = newElement.key || i.toString();
    const oldElement = oldChildrenElementsMap[newKey];
    if (oldElement === newElement) {
      const mountIndex = oldElement.mountIndex;
      if (mountIndex < lastIndex) {
        diffQueue.push({
          parentNode: dom,
          type: "MOVE",
          fromIndex: mountIndex,
          toIndex: i
        });
      }
      lastIndex = Math.max(mountIndex, lastIndex);
    } else {
      diffQueue.push({
        parentNode: dom,
        type: "INSERT",
        toIndex: i,
        dom: createDOM(newElement)
      });
    }
    newElement.mountIndex = i;
  }
  for (let oldKey in oldChildrenElementsMap) {
    if (newChildrenElementsMap.hasOwnProperty(oldKey)) {
      const oldElement = oldChildrenElementsMap[oldKey];
      diffQueue.push({
        parentNode: dom,
        type: "REMOVE",
        fromIndex: oldElement.mountIndex
      });
    }
  }
}
function patch() {
  const deleteMap = {};
  const deleteChildren = [];
  for (let i = 0; i < diffQueue.length; i++) {
    const { type, fromIndex, parentNode } = diffQueue[i];
    if (type === "MOVE" || type === "REMOVE") {
      const oldElement = parentNode.children[fromIndex];
      deleteMap[fromIndex] = oldElement;
      deleteChildren.push(oldElement);
    }
  }
  deleteChildren.forEach((child) => {
    child.parentNode.removeChild(child);
  });
  for (let i = 0; i < diffQueue.length; i++) {
    const { type, fromIndex, toIndex, parentNode, dom } = diffQueue[i];
    if (type === "MOVE") {
      insertChildAt(parentNode, deleteMap[fromIndex], toIndex);
    } else if (type === "INSERT") {
      insertChildAt(parentNode, dom, toIndex);
    }
  }
  diffQueue.length = 0;
}
function insertChildAt(parentNode, child, index) {
  const oldChild = parentNode.children[index];
  oldChild ? parentNode.insertBefore(child, oldChild) : parentNode.appendChild(child);
}
function getChildrenElementsMap(oldChildren) {
  const oldChildrenElementsMap = {};
  for (let i = 0; i < oldChildren.length; i++) {
    const oldKey = oldChildren[i].key || i.toString();
    oldChildrenElementsMap[oldKey] = oldChildren[i];
  }
  return oldChildrenElementsMap;
}
function getNewChildrenElementsMap(oldChildrenElementsMap, newChildren) {
  const newChildrenElementsMap = {};
  for (let i = 0; i < newChildren.length; i++) {
    const newElement = newChildren[i];
    if (!newElement) {
      continue;
    }
    const newKey = newElement.key || i.toString();
    const oldElement = oldChildrenElementsMap[newKey];
    if (canDeepCompare(oldElement, newElement)) {
      updateElement(oldElement, newElement);
      newChildren[i] = oldElement;
    }
    newChildrenElementsMap[newKey] = newChildren[i];
  }
  return newChildrenElementsMap;
}
function canDeepCompare(oldElement, newElement) {
  if (!!oldElement && !!newElement) {
    return oldElement.type === newElement.type;
  }
  return false;
}
function updateClassComponent(oldElement, newElement) {
  const componentInstance = newElement.componentInstance = oldElement.componentInstance;
  setContext(componentInstance, oldElement.type);
  const nextProps = newElement.props;
  componentInstance.componentWillReceiveProps(nextProps);
  componentInstance.state = newElement.type.getDerivedStateFromProps(nextProps, componentInstance.state);
  componentInstance.$updater.emitUpdate(nextProps);
}
function updateFunctionComponent(oldElement, newElement) {
  const oldRenderElement = oldElement.renderElement;
  const newRenderElement = newElement.type(newElement.props);
  const currentElement = compareTwoElements(oldRenderElement, newRenderElement);
  newElement.renderElement = currentElement;
}

// packages/react/src/component.ts
var Component = class {
  constructor(props) {
    this.props = props;
    this.$updater = new Updater(this);
    this.state = {};
    this.nextProps = null;
    this.isOverMount = false;
  }
  context;
  $updater;
  state;
  nextProps;
  isOverMount;
  static getDerivedStateFromProps(nextProps, oldState) {
    return oldState;
  }
  render() {
  }
  setState(partialState) {
    this.$updater.addState(partialState);
  }
  componentWillMount() {
  }
  componentDidMount() {
  }
  componentWillReceiveProps(nextProps) {
  }
  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }
  getSnapshotBeforeUpdate() {
  }
  componentWillUpdate() {
  }
  componentDidUpdate(props, state, extraArgs) {
  }
  componentWillUnmount() {
  }
  forceUpdate() {
    this.componentWillUpdate();
    const extraArgs = this.getSnapshotBeforeUpdate();
    const oldRenderElement = this["renderElement"];
    const newRenderElement = this.render();
    this["renderElement"] = compareTwoElements(oldRenderElement, newRenderElement);
    this.componentDidUpdate(this.props, this.state, extraArgs);
  }
};
Component.prototype["isReactComponent"] = true;

// packages/react/index.ts
function createElement(type, config = {}, ...children) {
  const { key, ref, ...props } = config;
  let nodeType = TEXT;
  if (isString(type)) {
    nodeType = ELEMENT;
  } else if (isFunction(type)) {
    nodeType = type.prototype.isReactComponent ? CLASS_COMPONENT : FUNCTION_COMPONENT;
  }
  children = flatten(children).map((child) => {
    if (isObject(child) || isFunction(child)) {
      return child;
    } else {
      return { nodeType: TEXT, type: TEXT, content: child };
    }
  });
  return ReactElement(nodeType, type, key, ref, props, children);
}
function createRef() {
  return { current: null };
}
function createContext(defaultValue) {
  function Provider(props, children) {
    Provider["value"] = props.value;
    return children;
  }
  function Consumer(children) {
    return onlyOne(children)(Provider["value"]);
  }
  Provider["value"] = defaultValue;
  return { Provider, Consumer };
}
export {
  Component,
  batchedUpdates,
  createContext,
  createElement,
  createRef
};
//# sourceMappingURL=react.esm.js.map
