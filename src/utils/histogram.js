import { Log } from "gudangjs";

export const generateHistogram = (jobList, metricFn, min, max, samples = 10) => {
  const step = Math.ceil((max - min) / samples);
  const Scale = { min: step, max: step * samples, step };

  let histogram = new Map();
  for (let i = Scale.min; i <= Scale.max; i += Scale.step) {
    histogram.set(i, 0);
  }

  jobList.forEach(obj => {
    const metric = metricFn(obj);
    const key = Math.floor(metric / step) * step + step;
    Log.debug(`Metric: ${metric}, Key: ${key}`);
    histogram.set(key, histogram.get(key) + 1);
  });

  return adjustKeysToRange(histogram);
};

function adjustKeysToRange(histogram) {
  let lastKey = -1;
  return Object.fromEntries(
    Array.from(histogram.entries()).map(([key, val]) => {
      const newKey = `${lastKey + 1} - ${key}`;
      lastKey = key;
      return [newKey, val];
    })
  );

}