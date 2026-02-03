#!/usr/bin/env node
import { Command } from "commander";

import { createConfigCommand } from "./commands/config.js";
import { createLabelsCommand } from "./commands/labels.js";
import { createQueryRangeCommand } from "./commands/query-range.js";
import { createQueryCommand } from "./commands/query.js";
import { createSeriesCommand } from "./commands/series.js";
import { createStatusCommand } from "./commands/status.js";
import { createTargetsCommand } from "./commands/targets.js";

const program = new Command();

program
  .name("prom")
  .description("Prometheus CLI - Query Prometheus from terminal")
  .version("1.0.0");

// Register commands
program.addCommand(createConfigCommand());
program.addCommand(createTargetsCommand());
program.addCommand(createQueryCommand());
program.addCommand(createQueryRangeCommand());
program.addCommand(createLabelsCommand());
program.addCommand(createSeriesCommand());
program.addCommand(createStatusCommand());

program.parse();
