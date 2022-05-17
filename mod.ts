import { EventEmitter } from "./deps.ts";

const DEFAULT_TIMEOUT = 3000;
const INIT_ID = 0;
const EVENT_CLOSED = 'closed';
const EVENT_DRAINED = 'drained';

class SeqQueue extends EventEmitter {
  
  timeout = DEFAULT_TIMEOUT;
  status: number;
  curId: number;
  // deno-lint-ignore no-explicit-any
  queue: any[];
  timerId: number|undefined;
  
  constructor(timeout?: number) {
    super();
    if(timeout && timeout > 0) {
      this.timeout = timeout;
    }
    this.status = STATUS_IDLE;
    this.curId = INIT_ID;
    this.queue = [];
  }
  
  /**
   * Add a task into queue.
   * 
   * @param fn new request
   * @param ontimeout callback when task timeout
   * @param timeout timeout for current request. take the global timeout if this is invalid
   * @returns true or false
   */
  // deno-lint-ignore ban-types
  push(fn: Function, ontimeout?: Function, timeout?: number) {
    if(this.status !== STATUS_IDLE && this.status !== STATUS_BUSY) {
      //ignore invalid status
      return false;
    }
    
    if(typeof fn !== 'function') {
      throw new Error('fn should be a function.');
    }
    this.queue.push({fn: fn, ontimeout: ontimeout, timeout: timeout});
  
    if(this.status === STATUS_IDLE) {
      this.status = STATUS_BUSY;
      // deno-lint-ignore no-this-alias
      const self = this;
      self.#next(self.curId);
    }
    return true;
  }
  
  /**
  * Close queue
  * @param {boolean} force? if true will close the queue immediately else will execute the rest task in queue
  */
  close(force?: boolean): void {
    if(this.status !== STATUS_IDLE && this.status !== STATUS_BUSY) {
      //ignore invalid status
      return;
    }
    
    if(force) {
      this.status = STATUS_DRAINED;
      if(this.timerId) {
        clearTimeout(this.timerId);
        this.timerId = undefined;
      }
      this.emit(EVENT_DRAINED);
    } else {
      this.status = STATUS_CLOSED;
      this.emit(EVENT_CLOSED);
    }
  }
  
  #next(tid: number) {
    if(tid !== this.curId || this.status !== STATUS_BUSY && this.status !== STATUS_CLOSED) {
      //ignore invalid next call
      return;
    }
    
    if(this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = undefined;
    }
    
    const task = this.queue.shift();
    if(!task) {
      if(this.status === STATUS_BUSY) {
        this.status = STATUS_IDLE;
        this.curId++;	//modify curId to invalidate timeout task
      } else {
        this.status = STATUS_DRAINED;
        this.emit(EVENT_DRAINED);
      }
      return;
    }
    
    // deno-lint-ignore no-this-alias
    const self = this;
    task.id = ++this.curId;
  
    let timeout = task.timeout > 0 ? task.timeout : this.timeout;
    timeout = timeout > 0 ? timeout : DEFAULT_TIMEOUT;
    this.timerId = setTimeout(function() {
      self.#next(task.id);
      self.emit('timeout', task);
      if(task.ontimeout) {
        task.ontimeout();
      }
    }, timeout);
  
    try {
      task.fn({
        done: function() {
          const res = task.id === self.curId;
          self.#next(task.id);
          return res;
        }
      });
    } catch(err) {
      self.emit('error', err, task);
      self.#next(task.id);
    }
  }
  
}

export function createQueue(timeout?: number) {
  return new SeqQueue(timeout);
}

export const STATUS_IDLE = 0;
export const STATUS_BUSY = 0;
export const STATUS_CLOSED = 0;
export const STATUS_DRAINED = 0;
