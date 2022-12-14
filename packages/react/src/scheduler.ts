import { hasOwnProperty, isFunction, isString } from "../../shared"
import { DELETION, PLACEMENT, TAG_CLASS_COMPONENT, TAG_COMMENT, TAG_ELEMENT, TAG_FUNCTION_COMPONENT, TAG_ROOT, TAG_TEXT, TEXT, UPDATE } from "../../types"
import { Updater, UpdaterQueue } from "./updater"

let workInProgressRoot : any = null
let nextUnitOfWork : any = null
let currentRoot : any = null
let workInProgressFiber : any = null
let hookIndex : number = 0
const deletions : Array<any> = []

function startWork() {
  requestIdleCallback(workLoop,{ timeout: 500 })
}
startWork()

function workLoop(deadline : any) {
  let shouldYield = false
  while(nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shouldYield = deadline.timeRemaining() < 1
  }
  if(!nextUnitOfWork && workInProgressRoot) {
    commitRoot()
  }
  startWork()
}

function commitRoot() {
  deletions.forEach(commitWork)
  let currentFiber = workInProgressRoot.firstEffect
  while(currentFiber) {
    commitWork(currentFiber)
    currentFiber = currentFiber.nextEffect
  }
  deletions.length = 0
  currentRoot = workInProgressRoot
  workInProgressRoot = null
}

function commitWork(currentFiber : any) {
  if(!currentFiber) return
  const  { 
    tag,effectTag,stateNode,
    props,type,children,alternate 
  } = currentFiber
  let parentFiber = currentFiber.parent
  while(
    parentFiber.tag !== TAG_ELEMENT && 
    parentFiber.tag !== TAG_ROOT &&
    parentFiber.tag !== TAG_TEXT &&
    parentFiber.tag !== TAG_COMMENT
  ) {
    parentFiber = parentFiber.parent
  }
  const parentNode = parentFiber.stateNode
  if(effectTag === PLACEMENT) {
    let nextFiber = currentFiber
    while(nextFiber.tag !== TAG_ELEMENT && nextFiber.tag !== TAG_TEXT && nextFiber.tag !== TAG_COMMENT) {
      nextFiber = currentFiber.child
    }
    parentNode.appendChild(nextFiber.stateNode)
  } else if(effectTag === DELETION) {
    commitDeletion(currentFiber,parentNode)
  } else if(effectTag === UPDATE) {
    if(type === TEXT && children !== alternate.children) {
      stateNode.textContent = children
    } else if(tag !== TAG_CLASS_COMPONENT && tag !== TAG_FUNCTION_COMPONENT) {
      updateDOM(stateNode,alternate.props,props)
    }
  }
  currentFiber.effectTag = null
}

function commitDeletion(currentFiber : any,parentNode : Node) {
  if(currentFiber.tag === TAG_ELEMENT || currentFiber.tag === TAG_TEXT) {
    parentNode.removeChild(currentFiber.stateNode)
  } else {
    commitDeletion(currentFiber.child,parentNode)
  }
}

function performUnitOfWork(currentFiber : any) {
  beginWork(currentFiber)
  if(currentFiber.child) {
    return currentFiber.child
  }
  while(currentFiber) {
    completeUnitOfWork(currentFiber)
    if(currentFiber.sibling) {
      return currentFiber.sibling
    }
    currentFiber = currentFiber.parent
  }
}

function completeUnitOfWork(currentFiber : any) {
  const { parent: parentFiber,effectTag } = currentFiber
  if(parentFiber) {
    if(!parentFiber.firstEffect) {
      parentFiber.firstEffect = currentFiber.firstEffect
    }
    if(currentFiber.lastEffect) {
      if(parentFiber.lastEffect) {
        parentFiber.lastEffect.nextEffect = currentFiber.firstEffect
      }
      parentFiber.lastEffect = currentFiber.lastEffect
    }
    if(effectTag) {
      if(parentFiber.lastEffect) {
        parentFiber.lastEffect.nextEffect = currentFiber
      } else {
        parentFiber.firstEffect = currentFiber
      }
      parentFiber.lastEffect = currentFiber
    }
  }
}

function beginWork(currentFiber : any) {
  const { tag } = currentFiber
  if(tag === TAG_ROOT) {
    updateHostRoot(currentFiber)
  } else if(tag === TAG_TEXT) {
    updateHostText(currentFiber)
  } else if(tag === TAG_ELEMENT) {
    updateHostElement(currentFiber)
  } else if(tag === TAG_CLASS_COMPONENT) {
    updateClassComponent(currentFiber)
  } else if(tag === TAG_FUNCTION_COMPONENT) {
    updateFunctionComponent(currentFiber)
  } else if(tag === TAG_COMMENT) {
    updateHostComment(currentFiber)
  }
}

function updateHostComment(currentFiber : any) {
  if(!currentFiber.stateNode) {
    currentFiber.stateNode = createDOM(currentFiber)
  }
}

function updateFunctionComponent(currentFiber : any) {
  workInProgressFiber = currentFiber
  hookIndex = 0
  workInProgressFiber.hooks = []
  const newChildren = [ currentFiber.type(currentFiber.props) ]
  reconcileChildren(currentFiber,newChildren)
}

function updateClassComponent(currentFiber : any) {
  if(!currentFiber.stateNode) {
    currentFiber.stateNode = new currentFiber.type(currentFiber.props)
    currentFiber.stateNode.internalFiber = currentFiber
    currentFiber.updaterQueue = currentFiber.stateNode.updaterQueue
  }
  currentFiber.stateNode.state = currentFiber.updaterQueue.forceUpdate(currentFiber.stateNode.state)
  const newElement = currentFiber.stateNode.render()
  const newChildren = [ newElement ]
  reconcileChildren(currentFiber,newChildren)
}

function updateHostElement(currentFiber : any) {
  if(!currentFiber.stateNode) {
    currentFiber.stateNode = createDOM(currentFiber)
  } 
  const children = currentFiber.children
  reconcileChildren(currentFiber,children)
}

function updateHostText(currentFiber : any) {
  if(!currentFiber.stateNode) {
    currentFiber.stateNode = createDOM(currentFiber)
  }
}

function updateHostRoot(currentFiber : any) {
  const children = currentFiber.children
  reconcileChildren(currentFiber,children)
}

function reconcileChildren(currentFiber : any,children : Array<any>) {
  let childrenIndex = 0
  let oldFiber = currentFiber.alternate && currentFiber.alternate.child
  if(oldFiber) {
    oldFiber.firstEffect = oldFiber.lastEffect = oldFiber.nextEffect = null
  }
  let prevSibling : any
  while(childrenIndex < children.length || oldFiber) {
    const newChild = children[childrenIndex++]
    const sameType = oldFiber && newChild && oldFiber.type === newChild.type

    let newFiber
    if(sameType) {
      if(oldFiber.alternate) {
        newFiber = oldFiber.alternate
        newFiber.props = newChild.props
        newFiber.children = newChild.children
        newFiber.alternate = oldFiber
        newFiber.effectTag = UPDATE
        newFiber.updaterQueue = oldFiber.updaterQueue || new UpdaterQueue()
        newFiber.nextEffect = null
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
        }
      }
    } else {
      if(newChild){
        let tag : Symbol
        if(newChild && isFunction(newChild.type)) {
          tag = newChild.type.prototype.isReactComponent ? TAG_CLASS_COMPONENT : TAG_FUNCTION_COMPONENT
        } else if(newChild.type === TEXT) {
          tag = TAG_TEXT
        } else if(isString(newChild.type)) {
          tag = TAG_ELEMENT
        } else {
          tag = TAG_COMMENT
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
        }
      } 
      if(oldFiber){
        oldFiber.effectTag = DELETION
        deletions.push(oldFiber)
      }
    }

    if(oldFiber) {
      oldFiber = oldFiber.sibling
    }

    if(newFiber) {
      if(childrenIndex === 1) {
        currentFiber.child = newFiber
      } else {
        prevSibling.sibling = newFiber
      }
      prevSibling = newFiber
    }
  }
}

function createDOM(currentFiber : any) {
  const { tag } = currentFiber
  if(tag === TAG_COMMENT) {
    return document.createComment(currentFiber.children)
  } else if(tag === TAG_TEXT) {
    return document.createTextNode(currentFiber.children)
  } else if(tag == TAG_ELEMENT) {
    const dom = document.createElement(currentFiber.type)
    updateDOM(dom,{},currentFiber.props)
    return dom
  }
}

function updateDOM(dom : HTMLElement,oldProps : any,newProps : any) {
  setProps(dom,oldProps,newProps)
}

function setProps(dom : HTMLElement,oldProps : any,newProps : any) {
  for(let key in oldProps) {
    if(hasOwnProperty(newProps,key)) {
      dom.removeAttribute(key)
    }
  }
  for(let key in newProps) {
    setProp(dom,key,newProps[key])
  }
}

function setProp(dom : HTMLElement,key : string,value : any) {
  if(/^on/.test(key)) {
    dom[key.toLowerCase()] = value
  } else if(key === "className") {
    dom.className = value
  } else if(key === "style") {
    for(let styleName in value) {
      dom.style[styleName] = value[styleName]
    }
  } else {
    dom.setAttribute(key,value)
  }
}

function scheduleRoot(rootFiber? : any) {
  if(currentRoot && currentRoot.alternate) {
    workInProgressRoot = currentRoot.alternate
    workInProgressRoot.alternate = currentRoot
    if(rootFiber) {
      workInProgressRoot.props = rootFiber.props
      workInProgressRoot.children = rootFiber.children
    }
  } else if(currentRoot) {
    if(rootFiber) {
      rootFiber.alternate = currentRoot
      workInProgressRoot = rootFiber
    } else {
      workInProgressRoot = {
        ...currentRoot,
        alternate: currentRoot
      }
    }
  } else {
    workInProgressRoot = rootFiber
  }
  workInProgressRoot.firstEffect = workInProgressRoot.lastEffect = workInProgressRoot.nextEffect = null
  nextUnitOfWork = workInProgressRoot
}

function useReducer(reducer : any,initialValue : any) {
  let hook = workInProgressFiber.alternate &&
             workInProgressFiber.alternate.hooks &&
             workInProgressFiber.alternate.hooks[hookIndex]
  if(hook) {
    hook.state = hook.updaterQueue.forceUpdate(hook.state)
  } else {
    hook = {
      state: initialValue,
      updaterQueue: new UpdaterQueue()
    }
  }
  const dispatch = (action : any) => {
    const payload = reducer ? reducer(hook.state,action) : action
    hook.updaterQueue.enqueueUpdate(
      new Updater(payload)
    )
    scheduleRoot()
  }
  workInProgressFiber.hooks[hookIndex++] = hook
  return [ hook.state,dispatch ]
}

function useState(initialValue : any) {
  return useReducer(null,initialValue)
}

export {
  scheduleRoot,
  useReducer,
  useState,
}