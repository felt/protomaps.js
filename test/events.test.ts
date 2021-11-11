import { EventQueue, ProtomapsEvent } from "../src/events";
import assert from "assert";
import baretest from "baretest";

test = baretest("Events");

test("Fires a non subscribed event", async () => {
  const queue = new EventQueue();
  queue.publish(ProtomapsEvent.RerenderStart);
  assert.equal(true, true);
});

test("Fires a subscribed event", async () => {
  const queue = new EventQueue();
  let calls = 0;
  queue.subscribe(ProtomapsEvent.RerenderStart, () => calls++);
  queue.publish(ProtomapsEvent.RerenderStart);
  assert.equal(calls, 1);
});

export default test;
