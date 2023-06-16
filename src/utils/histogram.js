import saveFile from "./saveFile.js";
import { debugLog } from "./logging.js";

export const generateHistogram = (jobList, min, max) => {
  const Scale = { min: min, max: max, step: Math.round((max - min) / 10) };
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
        return;
      }
    }
  });

  saveFile(
    `histogram.json`,
    JSON.stringify({
      histogram,
    })
  );

  debugLog("The file histogram.json has been saved!");
}
