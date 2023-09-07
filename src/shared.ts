export type ToThread = {
  type: "testMemory";
  memory: Uint32Array[];
  repetitionCount: number;
};

export function toThreadIsValid(p: any): p is ToThread {
  const toThread: ToThread = p;
  try {
    if (toThread.type != "testMemory") return false;
    for (const memory of toThread.memory) {
      if (!(memory instanceof Uint32Array)) return false;
    }
    if (typeof toThread.repetitionCount !== "number") return false;
    return true;
  } catch {
    return false;
  }
}

export type FromThread =
  | { type: "error"; message: string }
  | { type: "success"; timeInMS: number };

export function fromThreadIsValid(p: any): p is FromThread {
  const fromThread: FromThread = p;
  try {
    switch (fromThread.type) {
      case "error": {
        return typeof fromThread.message == "string";
      }
      case "success": {
        return typeof fromThread.timeInMS == "number";
      }
      default: {
        return false;
      }
    }
  } catch {
    return false;
  }
}
