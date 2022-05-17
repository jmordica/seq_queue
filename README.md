# seq_queue

Seq_queue is simple tool to keep requests to be executed in order.

As we known, Node.js codes run in asynchronous mode and the callbacks are unordered. But sometimes we may need the requests to be processed in order. For example, in a game, a player would do some operations such as turn right and go ahead. And in the server side, we would like to process these requests one by one, not do them all at the same time.

Seq_queue takes the responsibility to make the asynchronous, unordered processing flow into serial and ordered. It's simple but not a repeated wheel.

Seq-queue is a FIFO task queue and we can push tasks as we wish, anytime(before the queue closed), anywhere(if we hold the queue instance). A task is known as a function and we can do anything in the function and just need to call task.done() to tell the queue current task has finished. It promises that a task in queue would not be executed util all tasks before it finished.

Seq_queue add timeout for each task execution. If a task throws an uncaught exception in its call back or a developer forgets to call task.done() callback, queue would be blocked and would not execute the left tasks. To avoid these situations, seq-queue set a timeout for each task. If a task timeout, queue would drop the task and notify develop by a 'timeout' event and then invoke the next task. Any task.done() invoked in a timeout task would be ignored.

fock by https://github.com/changchang/seq-queue

## usage
```ts
import { assertEquals } from "https://deno.land/std@0.139.0/testing/asserts.ts";
import { createQueue, STATUS_IDLE } from "https://deno.land/x/seq_queue@v1.0.0/mod.ts";

Deno.test("seq_queue", function() {
  const timeout = 1000;
  const queue = createQueue(timeout);
  assertEquals(queue.status, STATUS_IDLE);
  // deno-lint-ignore no-explicit-any
  queue.push(function(task: any) {
    task.done();
    assertEquals(queue.status, STATUS_IDLE);
  });
});
```
