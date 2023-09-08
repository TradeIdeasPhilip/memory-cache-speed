import "./style.css";
import { assertClass, initializedArray, makePromise } from "phil-lib/misc";
import { getById } from "phil-lib/client-misc";
import { ToThread, fromThreadIsValid } from "./shared";

class Namer {
  private constructor() {
    throw new Error("wtf");
  }
  static readonly #descriptionSymbol = Symbol("Namer description");
  static #lastId = 0;
  static add(destination: object, description: string | object) {
    if (this.#descriptionSymbol in destination) {
      throw new Error("wtf — duplicate object name");
    }
    if (typeof description !== "string") {
      const newName = (description as any)[this.#descriptionSymbol];
      description = newName;
    }
    if (typeof description != "string") {
      throw new Error("wtf");
    }
    (destination as any)[this.#descriptionSymbol] = description;
    const asString = `#${this.#lastId} ${description}`;
    this.#lastId++;
    destination.toString = () => asString;
  }
}

function createRandom(count: number) {
  const result = new Uint32Array(count);
  const available = initializedArray(count - 1, (index) => index + 1);
  let destinationIndex = 0;
  while (available.length > 0) {
    const sourceIndex = (Math.random() * available.length) | 0;
    result[destinationIndex] = available[sourceIndex];
    available[sourceIndex] = available[available.length - 1];
    available.pop();
    destinationIndex = result[destinationIndex];
  }
  result[destinationIndex] = 0;
  const description = `Random ${count.toLocaleString()}`;
  Namer.add(result, description);
  return result;
}

function createInterleaved(itemCount: number, partitionCount: number) {
  const result = new Uint32Array(itemCount);
  let comeFromIndex = 0; // The first one will be wrong but we'll overwrite it at the end.
  for (let partition = 0; partition < partitionCount; partition++) {
    for (
      let goToIndex = partition;
      goToIndex < itemCount;
      goToIndex += partitionCount
    ) {
      result[comeFromIndex] = goToIndex;
      comeFromIndex = goToIndex;
    }
  }
  result[comeFromIndex] = 0; // Loop from the last one back to the first.
  const description = `Interleaved ${itemCount.toLocaleString()} ⋰ ${partitionCount.toLocaleString()}`;
  Namer.add(result, description);
  return result;
}

function copyMemory(memory: Uint32Array) {
  const result = new Uint32Array(memory);
  Namer.add(result, memory);
  return result;
}

(window as any).createRandom = createRandom;
(window as any).createInterleaved = createInterleaved;
(window as any).copyMemory = copyMemory;

const listElement = getById("list", HTMLSelectElement);
const bytesSpan = getById("bytes", HTMLSpanElement);
const copyButton = getById("copy", HTMLButtonElement);
const releaseButton = getById("release", HTMLButtonElement);
const testButton = getById("test", HTMLButtonElement);
const repetitionCountInput = getById("repetitionCount", HTMLInputElement);
const itemCountInput = getById("itemCount", HTMLInputElement);
const randomDataButton = getById("randomData", HTMLButtonElement);
const inOrderButton = getById("inOrder", HTMLButtonElement);
const partitionCountInput = getById("partitionCount", HTMLInputElement);

const headerRow = getById("header", HTMLTableRowElement);
const rowTemplate = getById("row", HTMLTemplateElement).content.querySelector(
  "tr"
)!;

function parseInt(s: string) {
  /**
   * Unary + is similar to Number.parseDouble(), but they each choose
   * to ignore different errors.  I want to return `undefined` if either
   * one reports an error.
   */
  const asNumber = +s;
  if (!isFinite(asNumber)) {
    return undefined;
  }
  const asInteger = Number.parseInt(s);
  if (!isFinite(asInteger)) {
    // The rules for NaN == something and NaN === are pretty crazy.
    // Just avoid them.
    return undefined;
  }
  if (asNumber != asInteger) {
    // It was a valid number, but not a valid integer.
    return undefined;
  }
  return asInteger;
}

function parsePositiveInt(s: string) {
  const i = parseInt(s);
  if (i === undefined || i <= 0) {
    return undefined;
  } else {
    return i;
  }
}

function isPositiveInt(s: string) {
  return parsePositiveInt(s) !== undefined;
}

function updateGUI() {
  const selected = [...listElement.selectedOptions];
  const somethingSelected = selected.length > 0;
  const nothingSelected = !somethingSelected;
  copyButton.disabled = nothingSelected;
  releaseButton.disabled = nothingSelected;
  if (!isPositiveInt(repetitionCountInput.value)) {
    // error
    repetitionCountInput.style.backgroundColor = "pink";
    testButton.disabled = true;
  } else {
    // What if a test is currently running?
    repetitionCountInput.style.backgroundColor = "";
    testButton.disabled = nothingSelected;
  }
  const itemCountValid = isPositiveInt(itemCountInput.value);
  if (itemCountValid) {
    itemCountInput.style.backgroundColor = "";
    randomDataButton.disabled = false;
  } else {
    itemCountInput.style.backgroundColor = "pink";
    randomDataButton.disabled = true;
  }
  const partitionCountValid = isPositiveInt(partitionCountInput.value);
  partitionCountInput.style.backgroundColor = partitionCountValid ? "" : "pink";
  inOrderButton.disabled = !(itemCountValid && partitionCountValid);
  let byteCount = 0;
  selected.forEach((option) => {
    const memory = getMemory(option);
    byteCount += memory.length * memory.BYTES_PER_ELEMENT;
  });
  bytesSpan.innerText = byteCount.toLocaleString();
}

(window as any).updateGUI = updateGUI;

[
  repetitionCountInput,
  partitionCountInput,
  itemCountInput,
  listElement,
].forEach((input) => input.addEventListener("input", updateGUI));

updateGUI();

const memorySymbol = Symbol("memory");

function setMemory(option: HTMLOptionElement, memory: Uint32Array) {
  (option as any)[memorySymbol] = memory;
}

function getMemory(option: HTMLOptionElement): Uint32Array {
  const memory = (option as any)[memorySymbol];
  if (memory instanceof Uint32Array) {
    return memory;
  } else {
    throw new Error("wtf");
  }
}

function addMemoryOption(memory: Uint32Array): HTMLOptionElement {
  const option = document.createElement("option");
  option.innerText = memory.toString();
  setMemory(option, memory);
  listElement.appendChild(option);
  return option;
}

randomDataButton.addEventListener("click", () => {
  const itemCount = parsePositiveInt(itemCountInput.value);
  if (itemCount === undefined) {
    throw new Error("wtf");
  }
  const memory = createRandom(itemCount);
  addMemoryOption(memory);
});

inOrderButton.addEventListener("click", () => {
  const itemCount = parsePositiveInt(itemCountInput.value);
  if (itemCount === undefined) {
    throw new Error("wtf");
  }
  const partitionCount = parsePositiveInt(partitionCountInput.value);
  if (partitionCount === undefined) {
    throw new Error("wtf");
  }
  const memory = createInterleaved(itemCount, partitionCount);
  addMemoryOption(memory);
});

copyButton.addEventListener("click", () => {
  const selected = [...listElement.selectedOptions];
  selected.forEach((option) => addMemoryOption(copyMemory(getMemory(option))));
});

releaseButton.addEventListener("click", () => {
  const selected = [...listElement.selectedOptions];
  selected.forEach((option) => option.remove());
  updateGUI();
});

const simpleNumberFormat = new Intl.NumberFormat("en-US", {
  maximumSignificantDigits: 6,
});

testButton.addEventListener("click", async () => {
  const selected = [...listElement.selectedOptions];
  const repetitionCount = parsePositiveInt(repetitionCountInput.value);
  if (repetitionCount === undefined) {
    throw new Error("wtf — The button should have been disabled.");
  }
  const row = assertClass(rowTemplate.cloneNode(true), HTMLTableRowElement);
  const [timestampCell, memoryCell, repeatCountCell, statusCell, buttonCell] =
    row.children;
  if (
    !(
      timestampCell instanceof HTMLTableCellElement &&
      memoryCell instanceof HTMLTableCellElement &&
      repeatCountCell instanceof HTMLTableCellElement &&
      statusCell instanceof HTMLTableCellElement
    )
  ) {
    throw new Error("wtf");
  }
  headerRow.parentElement!.insertBefore(row, headerRow.nextElementSibling);
  var now = new Date();
  timestampCell.innerText =
    ((now.getHours() + 11) % 12) +
    1 +
    ":" +
    now.getMinutes().toString().padStart(2, "0") +
    ":" +
    now.getSeconds().toString().padStart(2, "0");
  selected.forEach((element, index) => {
    if (index > 0) {
      memoryCell.append(", ");
    }
    const span = document.createElement("span");
    span.classList.add("memoryName");
    span.innerText = getMemory(element).toString();
    memoryCell.appendChild(span);
    repeatCountCell.innerText = repetitionCount.toLocaleString();
  });
  const button = assertClass(buttonCell.firstElementChild, HTMLButtonElement);
  button; // TODO use this!

  try {
    const milliseconds = await sendRequestToThread(
      selected.map(getMemory),
      repetitionCount
    );
    statusCell.innerText = `${simpleNumberFormat.format(
      milliseconds * 1000
    )}µs total, ${simpleNumberFormat.format(
      (milliseconds * 1000) / repetitionCount
    )}µs / repetition`;
    statusCell.dataset["status"] = "complete";
  } catch (reason: unknown) {
    statusCell.innerText = reason + "";
    statusCell.dataset["status"] = "error";
  }
});

async function sendRequestToThread(
  memory: Uint32Array[],
  repetitionCount: number
) {
  const worker = new Worker(new URL("./worker.ts", import.meta.url), {
    type: "module",
  });

  const request: ToThread = {
    type: "testMemory",
    memory,
    repetitionCount,
  };
  const fromThread = makePromise<number>();
  worker.addEventListener("message", (messageEvent) => {
    const response = messageEvent.data;
    if (fromThreadIsValid(response)) {
      if (response.type == "success") {
        fromThread.resolve(response.timeInMS);
      } else {
        fromThread.reject(response.message);
      }
    } else {
      console.error(fromThread, "message");
      fromThread.reject(new Error("Unexpected response from thread."));
    }
  });
  worker.addEventListener("error", (event) => {
    console.error(event, "error");
    fromThread.reject("error");
  });
  worker.addEventListener("messageerror", (event) => {
    console.error(event, "messageerror");
    fromThread.reject("messageerror");
  });
  worker.postMessage(request);
  return fromThread.promise;
}

/*
c++ gives you so much control over how your data is laid out.  You can possibly
make things a lot faster by having related data all close together in memory.

Is the same thing true in JavaScript?  Can I measure it?
*/

/*
Worker Threads and Shared Memory for JavaScript Performance.

I got an unexpected bonus.  
I knew I'd have to create a worker thread to keep the GUI live.
Now, with no additional work, I can run tests in multiple threads at once.


As for my original question, I **can** see differences in different types of memory access in JavaScript.
It is much faster to access the memory in order.
Now i need to do some more organized tests.


This is all leading up to some bigger questions.
Does it make sense to store data in a B+ tree, even if it's all stored in memory and it never changes?

See the link in the description to try this yourself.
*/
