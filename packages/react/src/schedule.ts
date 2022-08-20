import { hasOwnProperty, isString } from "../../shared"
import { PLACEMENT, TAG_COMMENT, TAG_ELEMENT, TAG_ROOT, TAG_TEXT, TEXT } from "../../types"

let workInProgressRoot : any = null
let nextUnitOfWork : any = null

function startWork() {
  requestIdleCallback(workLoop,{ timeout: 500 })
}
startWork()

function workLoop(deadline : any) {
  let shouldYield = false
  while(nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    shouldYield = deadline.timeRemainning() < 1
  }
  if(!nextUnitOfWork && workInProgressRoot) {
    commitRoot()
  }
  startWork()
}

function commitRoot() {
  let currentFiber = workInProgressRoot.firstEffect
  while(currentFiber) {
    commitWork(currentFiber)
    currentFiber = currentFiber.nextEffect
  }
  workInProgressRoot = null
}

function commitWork(currentFiber : any) {
  if(!currentFiber) return
  const parentFiber = currentFiber.parent
  const parentNode = parentFiber.stateNode
  if(currentFiber.effectTag === PLACEMENT) {
    parentNode.appendChild(currentFiber.stateNode)
  }
  currentFiber.effectTag = null
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
  const { parentFiber,effectTag } = currentFiber.parent
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
    updateHostElement(TAG_ELEMENT)
  }
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
  let prevSibling : any
  while(childrenIndex < children.length) {
    const child = children[childrenIndex++]
    let tag : Symbol
    if(child.type === TEXT) {
      tag = TAG_TEXT
    } else if(isString(child.type)) {
      tag = TAG_ELEMENT
    } else {
      tag = TAG_COMMENT
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
    }
    if(childrenIndex === 1) {
      currentFiber.child = childFiber
    } else {
      prevSibling.sibling = childFiber
    }
    prevSibling = childFiber
  }
}

function createDOM(currentFiber : any) {
  const { tag } = currentFiber
  if(tag === TAG_TEXT) {
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

function scheduleRoot(rootFiber : any) {
  workInProgressRoot = rootFiber
  nextUnitOfWork = rootFiber
}

export {
  scheduleRoot,
}