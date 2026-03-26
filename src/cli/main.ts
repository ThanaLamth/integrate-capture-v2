import { parseCliArgs, runCli } from "./index";

const options = parseCliArgs(process.argv.slice(2));

runCli(options).catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
