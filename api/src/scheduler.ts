import humanInterval from "human-interval";
import { getPrettyTime } from "./shared/utils/date";

class TaskDef {
  name: string;
  function: () => Promise<void>;
  interval: number;
  runAtStart: boolean;
  runningPromise: Promise<void> = null;
  successfulRunCount: number = 0;
  failedRunCount: number = 0;
  latestError: string | Error = null;

  get runCount() {
    return this.successfulRunCount + this.failedRunCount;
  }

  constructor(name: string, fn: () => Promise<void>, interval: number, runAtStart?: boolean) {
    this.name = name;
    this.function = fn;
    this.interval = interval;
    this.runAtStart = runAtStart;
  }
}

export class Scheduler {
  private tasks: Map<string, TaskDef> = new Map();

  public registerTask(name: string, fn: () => Promise<void>, interval: number | string, runAtStart: boolean = true): void {
    if (this.tasks.has(name)) {
      throw new Error(`Task with name "${name}" already exists`);
    }

    if (typeof interval === "string" && isNaN(humanInterval(interval))) {
      throw new Error(`Invalid interval "${interval}"`);
    }

    const intervalMs = typeof interval === "string" ? humanInterval(interval) : interval;
    console.log(`Registered task "${name}" to run every ${getPrettyTime(intervalMs)}`);

    this.tasks.set(name, new TaskDef(name, fn, intervalMs, runAtStart));
  }

  public start(): void {
    for (const task of this.tasks.values()) {
      if (task.runAtStart) {
        task.function();
      }

      setInterval(() => {
        const runningTask = this.tasks.get(task.name);
        if (runningTask.runningPromise) {
          console.log(`Skipping task "${task.name}" because it is already running`);
          return;
        }

        console.log(`Starting task "${task.name}"`);
        runningTask.runningPromise = runningTask
          .function()
          .then(() => {
            console.log("Task finished successfully");
            runningTask.successfulRunCount++;
          })
          .catch((err) => {
            console.log("Task failed");
            runningTask.failedRunCount++;
            runningTask.latestError = err;
          })
          .finally(() => {
            console.log(`Task "${task.name}" finished`);
            runningTask.runningPromise = null;
          });
      }, task.interval);

      //setInterval(() => this.displayTaskStatus(), 5000);
    }
  }

  // public displayTaskStatus(): void {
  //   console.table(Array.from(this.tasks.values()));
  // }
}
