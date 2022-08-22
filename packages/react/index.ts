import { isFunction, isObject } from "../shared"
import { TEXT } from "../types"
import { Component } from "./src/component"
import { useState,useReducer } from "./src/scheduler"

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
  Component,
  createElement,
  useState,
  useReducer,
}