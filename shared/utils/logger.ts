import pc from "picocolors";

export const logger = {
  info(msg: string): void {
    console.log(`${pc.cyan("ℹ")} ${msg}`);
  },
  success(msg: string): void {
    console.log(`${pc.green("✔")} ${pc.green(msg)}`);
  },
  warn(msg: string): void {
    console.log(`${pc.yellow("⚠")} ${pc.yellow(msg)}`);
  },
  error(msg: string): void {
    console.error(`${pc.red("✖")} ${pc.red(msg)}`);
  },
  step(current: number, total: number, msg: string): void {
    console.log(`${pc.dim(`[${current}/${total}]`)} ${pc.bold(msg)}`);
  },
  banner(title: string, subtitle?: string): void {
    const border = pc.cyan("═".repeat(60));
    console.log("\n" + border);
    console.log(pc.bold(pc.cyan(`  ${title}`)));
    if (subtitle) {
      console.log(pc.dim(`  ${subtitle}`));
    }
    console.log(border + "\n");
  },
  table(rows: Array<Record<string, string>>): void {
    if (console.table) {
      console.table(rows);
    } else {
      console.log(JSON.stringify(rows, null, 2));
    }
  },
};
