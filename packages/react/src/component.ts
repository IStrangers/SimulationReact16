import { scheduleRoot } from "./scheduler"
import { Updater, UpdaterQueue } from "./updater"

class Component {

  public updaterQueue = new UpdaterQueue()

  constructor(public props : any) {

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