import { scheduleRoot } from "../react/src/scheduler"
import { TAG_ROOT } from "../types"

function render(element : any, container : Node) {
  const rootFiber = {
    tag: TAG_ROOT,
    stateNode : container,
    props: {
    },
    children: [element]
  }
  scheduleRoot(rootFiber)
}

export {
  render,
}