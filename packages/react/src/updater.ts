import { isFunction, isObject } from "../../shared"

class Updater {

  public nextUpdater : Updater | null = null

  constructor(public payload : any) {

  }
  
}

class UpdaterQueue {

  public firstUpdater : Updater | null = null
  public lastUpdater : Updater | null = null

  enqueueUpdate(updater : Updater) {
    if(this.lastUpdater === null) {
      this.firstUpdater = this.lastUpdater = updater
    } else {
      this.lastUpdater.nextUpdater = updater
      this.lastUpdater = updater
    }
  }

  forceUpdate(state : any) {
    let currentUpdater = this.firstUpdater
    while(currentUpdater) {
      const nextState : any = isFunction(currentUpdater.payload) ? currentUpdater.payload(state) : currentUpdater.payload
      state = isObject(nextState) ? { ...state,...nextState} : nextState
      currentUpdater = currentUpdater.nextUpdater
    }
    this.firstUpdater = this.lastUpdater = null
    return state
  }
}

export {
  Updater,
  UpdaterQueue,
}