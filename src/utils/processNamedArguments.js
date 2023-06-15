export const processNamedArguments = () => {
  const args = process.argv.slice(2);

  const namedArgs = {};

  for (let i = 0; i < args.length; i += 2) {
    const argName = args[i].replace(/^--/, '');
    const argValue = args[i + 1];
    namedArgs[argName] = argValue;
  }

  return namedArgs;
}

export default processNamedArguments;