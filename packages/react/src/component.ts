import { scheduleRoot } from "./scheduler"
import { Updater, UpdaterQueue } from "./updater"

class Component {

  public updaterQueue

  constructor(public props : any) {
    this.updaterQueue = new UpdaterQueue()
  }

  setState(playload : any) {
    const updater = new Updater(playload)
    this.updaterQueue.enqueueUpdate(updater)
    scheduleRoot()
  }
}

Component.prototype["isReactComponent"] = true

export {
  Component
}