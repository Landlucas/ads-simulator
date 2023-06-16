import FakeTimers from "@sinonjs/fake-timers";

import staticArrivalTimes from "./data/arrivalTimes.js";
import staticServiceTimes from "./data/serviceTimes.js";
import delay from "./utils/delay.js";
import { generateHistogram } from "./utils/histogram.js";
import processNamedArguments from "./utils/processNamedArguments.js";
import { getBellCurveRandomNumbers, getRandomNumbersInRange } from "./utils/randomNumbers.js";
import { log, debugLog } from "./utils/logging.js";

const args = processNamedArguments();

let arrivalTimes = [];
let serviceTimes = [];

const servers = [];
const queue = [];
const completedJobs = [];

let clock;

let totalJobs = 0;

const initSimulation = async () => {
  log("initializing simulation...");

  clock = FakeTimers.install({
    shouldAdvanceTime: true,
    advanceTimeDelta: 1,
  });

  if (args["randomize"]) {
    let numberOfRandomJobs = 250;
    if (!isNaN(args["randomize"])) {
      numberOfRandomJobs = args["randomize"];
    }
    arrivalTimes = getBellCurveRandomNumbers(4.628, 1.949, numberOfRandomJobs);
    serviceTimes = getRandomNumbersInRange(8, 14, numberOfRandomJobs);
  } else {
    arrivalTimes = staticArrivalTimes;
    serviceTimes = staticServiceTimes;
  }

  let numberOfServers = 1;
  if (args["servers"] && !isNaN(args["servers"])) {
    numberOfServers = args["servers"];
  }
  for (let i = 1; i <= numberOfServers; i++) {
    servers.push(
      {
        id: i,
        status: "idle",
        idleStartTime: 0,
        totalIdleTime: 0,
      },
    );
  }

  log(`simulation started with ${arrivalTimes.length} incoming arrivals...`);
  const arrivalTime = arrivalTimes.shift();
  setTimeout(() => simulateArrivals(), arrivalTime);
};

const simulateArrivals = async () => {
  if (arrivalTimes.length > 0) {
    const arrivalTime = arrivalTimes.shift();
    setTimeout(() => simulateArrivals(), arrivalTime);
  }

  const id = ++totalJobs;
  const job = {
    id: id,
    arrivalTime: Date.now(),
    serviceDuration: serviceTimes[id],
  };
  queue.push(job);
  debugLog(`job ${job.id} arrived at time ${job.arrivalTime}`);
  serveJob();

  if (arrivalTimes.length === 0) {
    while (servers.find((server) => server.status === "busy")) {
      await delay(1);
    }
    log("arrivals ended and all jobs finished, stopping simulation...");
    showResults();
    process.exit(0);
  }
};

const serveJob = async () => {
  if (queue.length > 0) {
    if (!servers.find((server) => server.status === "idle")) {
      debugLog("all servers busy, keeping jobs in queue");
      return;
    }
    for (const server of servers) {
      if (server.status === "idle") {
        assignJob(server);
        break;
      }
    }
  }
};

const assignJob = (server) => {
  server.status = "busy";
  server.currentJob = queue.shift();
  server.currentJob.serviceStartTime = Date.now();

  server.totalIdleTime += Date.now() - server.idleStartTime;
  server.idleStartTime = null;

  debugLog(
    `server ${server.id} is now busy with job ${server.currentJob.id}`
  );

  setTimeout(() => {
    const serviceFinishTime = Date.now();
    completeJob(server, serviceFinishTime);
  }, server.currentJob.serviceDuration);

  if (!args["realtime"]) {
    clock.next();
  }
};

const completeJob = (server, serviceFinishTime) => {
  const job = server.currentJob;
  server.currentJob = null;
  server.status = "idle";

  job.serviceFinishTime = serviceFinishTime;
  completedJobs.push(job);

  debugLog(
    `job ${job.id} finished at ${serviceFinishTime} by server ${server.id}`
  );

  server.idleStartTime = Date.now();

  serveJob();
};

const showResults = () => {
  const totalIdleTime = servers.reduce((sum, obj) => {
    return sum + obj.totalIdleTime;
  }, 0);
  const averageIdleTime = totalIdleTime / servers.length;
  log(`average server idle time: ${averageIdleTime}`);

  let minTimeDiff = 9999999;
  let maxTimeDiff = 0;
  const totalQueueTime = completedJobs.reduce((sum, obj) => {
    const timeDiff = obj.serviceStartTime - obj.arrivalTime;
    if (timeDiff < minTimeDiff) minTimeDiff = timeDiff;
    if (timeDiff > maxTimeDiff) maxTimeDiff = timeDiff;
    return sum + timeDiff;
  }, 0);
  const averageQueue = totalQueueTime / completedJobs.length;
  log(`average time in queue: ${averageQueue}`);
  generateHistogram(completedJobs, minTimeDiff, maxTimeDiff);

  const totalSum = completedJobs.reduce((sum, obj) => {
    const timeDiff = obj.serviceFinishTime - obj.arrivalTime;
    return sum + timeDiff;
  }, 0);
  const averageSum = totalSum / completedJobs.length;
  log(`average time between arrival and end of service: ${averageSum}`);
}

initSimulation();
