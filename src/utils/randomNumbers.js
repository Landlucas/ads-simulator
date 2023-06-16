export const getBellCurveRandomNumbers = (mean, standardDeviation, count) => {
  const numbers = [];

  const generateBellCurveRandomNumber = () => {
    let u = 0;
    let v = 0;
    let s = 0;

    do {
      u = Math.random() * 2 - 1;
      v = Math.random() * 2 - 1;
      s = u * u + v * v;
    } while (s === 0 || s >= 1);

    const multiplier = Math.sqrt((-2 * Math.log(s)) / s);
    return mean + standardDeviation * u * multiplier;
  };
  
  for (let i = 0; i < count; i++) {
    let randomNumber = 0;
    while (randomNumber <= 0) {
      randomNumber = generateBellCurveRandomNumber();
    }
    numbers.push(~~randomNumber);
  }

  return numbers;
};

export const getRandomNumbersInRange = (min, max, count) => {
  const interval = (max + 1 - min) / count;
  const numbers = [];

  for (let i = 0; i < count; i++) {
    const randomNumber = Math.random() * interval + min + (interval * i);
    numbers.push(~~randomNumber);
  }

  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }

  return numbers;
}
