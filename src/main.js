import FakeTimers from "@sinonjs/fake-timers";
import { ConsoleLogAppender, Log, LogLevel, RawLogFormatter } from "gudangjs";

import staticArrivalTimes from "./data/arrivalTimes.js";
import staticServiceTimes from "./data/serviceTimes.js";
import delay from "./utils/delay.js";
import { generateHistogram } from "./utils/histogram.js";
import processNamedArguments from "./utils/processNamedArguments.js";
import { getBellCurveRandomNumbers, getRandomNumbersInRange } from "./utils/randomNumbers.js";

Log.setAppenders([new ConsoleLogAppender(new RawLogFormatter())]);

const args = processNamedArguments();
if (args["debug"]) {
  Log.level = LogLevel.DEBUG;
}

let arrivalTimes = [];
let serviceTimes = [];

const servers = [];
const queue = [];
const completedJobs = [];

let clock;

let totalJobs = 0;

const initSimulation = async () => {
  Log.info("initializing simulation...");

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

  Log.info(`simulation started with ${arrivalTimes.length} incoming arrivals...`);
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
  Log.debug(`job ${job.id} arrived at time ${job.arrivalTime}`);
  serveJob();

  if (arrivalTimes.length === 0) {
    while (servers.find((server) => server.status === "busy")) {
      await delay(1);
    }
    Log.info("arrivals ended and all jobs finished, stopping simulation...");
    showResults();
    process.exit(0);
  }
};

const serveJob = async () => {
  if (queue.length > 0) {
    if (!servers.find((server) => server.status === "idle")) {
      Log.debug("all servers busy, keeping jobs in queue");
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

  Log.debug(
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

  Log.debug(
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
  Log.info(`average server idle time: ${averageIdleTime}`);

  let minTimeDiff = 9999999;
  let maxTimeDiff = 0;
  const totalQueueTime = completedJobs.reduce((sum, obj) => {
    const timeDiff = obj.serviceStartTime - obj.arrivalTime;
    if (timeDiff < minTimeDiff) minTimeDiff = timeDiff;
    if (timeDiff > maxTimeDiff) maxTimeDiff = timeDiff;
    return sum + timeDiff;
  }, 0);
  const averageQueue = totalQueueTime / completedJobs.length;
  Log.info(`average time in queue: ${averageQueue}`);

  const queueTimeHistogram = generateHistogram(completedJobs,
    (obj) => Math.round(obj.serviceStartTime - obj.arrivalTime),
    minTimeDiff, maxTimeDiff
  );

  Log.debug(`histogram: ${JSON.stringify(queueTimeHistogram)}`);

  const totalSum = completedJobs.reduce((sum, obj) => {
    const timeDiff = obj.serviceFinishTime - obj.arrivalTime;
    return sum + timeDiff;
  }, 0);
  const averageSum = totalSum / completedJobs.length;
  Log.info(`average time between arrival and end of service: ${averageSum}`);
}

initSimulation();
