import saveFile from "./saveFile.js";
import { debugLog } from "./logging.js";

export const generateHistogram = (jobList, min, max) => {
  const step = Math.round((max - min) / 10);
  const Scale = { min: step, max: max, step: step };
  const histogram = {};
  for (let i = Scale.min; i <= Scale.max; i += Scale.step) {
    histogram[i] = 0;
  }

  jobList.forEach((obj) => {
    const timeDiff = obj.serviceStartTime - obj.arrivalTime;
    const roundedTimeDiff = Math.round(timeDiff);

    for (let i = Scale.min; i <= Scale.max; i += Scale.step) {
      if (roundedTimeDiff <= i) {
        histogram[i] += 1;
        debugLog(`roundedTimeDiff: ${roundedTimeDiff} <= i: ${i}`);
        return;
      }
    }
  });

  let lastKey = -1;
  for (let key of Object.keys(histogram)) {
    histogram[`${lastKey + 1} - ${key}`] = histogram[key];
    delete histogram[key];
    lastKey = parseInt(key);
  }

  saveFile(
    `histogram.json`,
    JSON.stringify({
      histogram,
    })
  );

  debugLog("The file histogram.json has been saved!");
}
