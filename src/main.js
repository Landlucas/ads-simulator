import FakeTimers from "@sinonjs/fake-timers";

import staticArrivalTimes from "./data/arrivalTimes.js";
import staticServiceTimes from "./data/serviceTimes.js";
import delay from "./utils/delay.js";
import processNamedArguments from "./utils/processNamedArguments.js";
import { getBellCurveRandomNumbers, getRandomNumbersInRange } from "./utils/randomNumbers.js";

const args = processNamedArguments();

let arrivalTimes = [];
let serviceTimes = [];

const servers = [];
const queue = [];
const completedJobs = [];

let clock;

let totalJobs = 0;

const initSimulation = async () => {
  console.log("initializing simulation...");

  clock = FakeTimers.install({
    shouldAdvanceTime: true,
    advanceTimeDelta: 1,
  });

  if (args["randomize"]) {
    let numberOfRandomJobs = 250;
    if (!isNaN(args["randomize"])) {
      numberOfRandomJobs = args["randomize"];
    }
    arrivalTimes = getBellCurveRandomNumbers(4.63, 1.95, numberOfRandomJobs);
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
      },
    );
  }

  console.log(`starting ${arrivalTimes.length} arrivals...`);
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
    arrival: Date.now(),
    serviceTime: serviceTimes[id],
  };
  queue.push(job);
  console.log(`job ${job.id} arrived at ${job.arrival}`);
  serveJob();

  if (arrivalTimes.length === 0) {
    while (servers.find((server) => server.status === "busy")) {
      await delay(1);
    }
    console.log("arrivals ended and all jobs finished, stopping simulation...");
    process.exit(0);
  }
};

const serveJob = async () => {
  if (queue.length > 0) {
    if (!servers.find((server) => server.status === "idle")) {
      console.log("all servers busy, keeping jobs in queue");
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

  console.log(
    `server "${server.id}" is now busy with job ${server.currentJob.id}`
  );

  setTimeout(() => {
    const completionTime = new Date().getTime();
    completeJob(server, completionTime);
  }, server.currentJob.serviceTime);

  if (!args["realtime"]) {
    clock.next();
  }
};

const completeJob = (server, completionTime) => {
  const job = server.currentJob;
  server.currentJob = null;
  server.status = "idle";

  job.completionTime = completionTime;
  completedJobs.push(job);

  console.log(
    `job ${job.id} completed at ${completionTime} by server "${server.id}"`
  );
  serveJob();
};

initSimulation();
