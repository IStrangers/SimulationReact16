import { isFunction, isObject } from "../shared"
import { TEXT } from "../types"

function createElement(type : any,config : any,...children : Array<any>) {
  return {
    type,
    props: {
      ...config
    },
    children : children.map(child => {
      if(isObject(child) || isFunction(child)) {
        return child
      }
      return {
        type: TEXT,
        props: {
        },
        children: child
      }
    })
  }
}

export {
  createElement,
}