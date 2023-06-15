export const getBellCurveRandomNumbers = (mean, standardDeviation, count) => {
  const numbers = [];
  
  for (let i = 0; i < count; i++) {
    let u = 0;
    let v = 0;
    let s = 0;

    do {
      u = Math.random() * 2 - 1;
      v = Math.random() * 2 - 1;
      s = u * u + v * v;
    } while (s === 0 || s >= 1);

    const multiplier = Math.sqrt((-2 * Math.log(s)) / s);
    const randomNumber = mean + standardDeviation * u * multiplier;

    numbers.push(randomNumber);
  }

  return numbers;
};

export const getRandomNumbersInRange = (min, max, count) => {
  const interval = (max - min) / count;
  const numbers = [];

  for (let i = 0; i < count; i++) {
    const randomNumber = Math.random() * interval + min + (interval * i);
    numbers.push(randomNumber);
  }

  return numbers;
}
