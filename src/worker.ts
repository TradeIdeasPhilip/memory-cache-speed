import { FromThread, toThreadIsValid } from "./shared";

function testMemory(allMemory: readonly Uint32Array[], count = 1) {
  const startTime = performance.now();
  for (let c = 0; c < count; c++) {
    allMemory.forEach((memory) => {
      const max = memory.length - 1;
      let index = 0;
      for (let i = 0; i < max; i++) {
        index = memory[index];
        if (index == 0) {
          // This shouldn't happen.  If it does then the program must have made a
          // mistake when it initialized the memory.  In any case it's good to
          // check for this so the compiler doesn't just optimize the whole loop
          // away!
          throw new Error("wtf");
        }
      }
      index = memory[index];
      if (index != 0) {
        // This shouldn't happen.  We should have made it exactly one time through
        // the loop, landing where we started, at 0.
        throw new Error("wtf");
      }
    });
  }
  const endTime = performance.now();
  return endTime - startTime;
}

/**
 * If a worker thread catches an exception, how does it report that to the main program?
 *
 * This is optimized for an Error object, because that's what is normally thrown.
 * However because you can throw and catch anything, this works on anything.
 * @param reason Something you caught in a try block.
 * @returns A string version of the thing you caught.
 */
function stringify(reason: unknown): string {
  if (reason instanceof Error) {
    return reason.stack ?? reason.toString();
  } else {
    return "" + reason;
  }
}

onmessage = (event) => {
  //console.log(event, "Ⓐ received in thread.onmessage");
  const request = event.data;
  //console.log("Ⓑ", request);
  if (toThreadIsValid(request)) {
    try {
      if (request.repetitionCount == 666) {
        // Fail on purpose to test the error handler.
        throw new Error("That request is evil!");
      }
      const timeInMS = testMemory(request.memory, request.repetitionCount);
      const response: FromThread = { type: "success", timeInMS };
      postMessage(response);
    } catch (reason: unknown) {
      const response: FromThread = {
        type: "error",
        message: stringify(reason),
      };
      postMessage(response);
    }
  } else {
    //console.log("Ⓒ", request);
  }
};

/*
console.log("① Hello from worker.ts; back in 5 seconds.", new Date());
await sleep(5000);
console.log("② I'm back.", new Date());
*/
