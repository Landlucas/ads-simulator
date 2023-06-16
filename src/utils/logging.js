import processNamedArguments from "./processNamedArguments.js";

const args = processNamedArguments();

export const debugLog = (data) => {
  if (args["debug"]) {
    console.log(data);
  }
};

export const log = (data) => {
  console.log(data);
};