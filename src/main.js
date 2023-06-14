// import { FakeTimers } from "@sinonjs/fake-timers";
import { install } from '@sinonjs/fake-timers';
// const FakeTimers = require("@sinonjs/fake-timers");

// import { Queue } from "./Queue";
import { arrivals } from "./arrivals.js";
// import { timeOfServices } from "./timeOfServices";

// let clock = FakeTimers.createClock();

const servers = [];
// const waitingQueue = new Queue();

const init = () => {
  console.log("initializing");

  install({
    shouldAdvanceTime: true,
    advanceTimeDelta: 1,
  });

  servers.push({
    name: "server1",
    status: "idle",
  });

  console.log("starting arrivals");
  runArrivals();
};

const runArrivals = async () => {
  for (const time of arrivals) {
    await delay(time);
    console.log(`Timeout after ${time} milliseconds at ${Date.now()}`);
  }
}

const delay = async (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

init();
