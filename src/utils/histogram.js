import { Log } from "gudangjs";

export const generateHistogram = (jobList, metricFn, min, max, samples = 10) => {
  const step = Math.round((max - min) / samples);
  const Scale = { min: step, max: max, step: step };

  let histogram = {};
  for (let i = Scale.min; i <= Scale.max; i += Scale.step) {
    histogram[i] = 0;
  }

  jobList.forEach((obj) => {
    const metric = metricFn(obj);

    for (let i = Scale.min; i <= Scale.max; i += Scale.step) {
      if (metric <= i) {
        histogram[i] += 1;
        Log.debug(`Metric: ${metric} <= i: ${i}`);
        break;
      }
    }
  });

  return adjustKeysToRange(histogram);
}

function adjustKeysToRange(histogram) {
  let lastKey = -1;
  return Object.fromEntries(
    Object.entries(histogram).map(([key, val]) => {
      const newKey = `${lastKey + 1} - ${key}`;
      lastKey = parseInt(key);
      return [newKey, val];
    })
  );

}