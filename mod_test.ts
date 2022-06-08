import { assertEquals } from "https://deno.land/std@0.142.0/testing/asserts.ts";
import { createQueue, STATUS_IDLE } from "./mod.ts";

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
