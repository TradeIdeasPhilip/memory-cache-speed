import "./style.css";
import { initializedArray } from "phil-lib/misc";
import {getById} from "phil-lib/client-misc";

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
  const description = `Random ${count}`;
  result.toString = () => description;
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
  const description = `Interleaved ${itemCount} ⋰ ${partitionCount}`;
  result.toString = () => description;
  return result;
}

function copyMemory(memory : Uint32Array) {
  const result = new Uint32Array(memory);
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

function parseInt(s : string) {
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

function parsePositiveInt(s : string) {
  const i = parseInt(s);
  if (i === undefined || i <= 0) {
    return undefined;
  } else {
    return i;
  }
}

function isPositiveInt(s : string) {
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
    repetitionCountInput.style.backgroundColor="pink";
    testButton.disabled = true;
  } else {
    // What if a test is currently running?
    repetitionCountInput.style.backgroundColor="";
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
  partitionCountInput.style.backgroundColor = partitionCountValid?"":"pink";
  inOrderButton.disabled = !(itemCountValid && partitionCountValid);
  let byteCount = 0;
  selected.forEach(option => {
    const memory = getMemory(option);
    byteCount += memory.length * memory.BYTES_PER_ELEMENT;
  });
  bytesSpan.innerText = byteCount.toLocaleString();
}

(window as any).updateGUI = updateGUI;

const memorySymbol = Symbol("memory");

function setMemory(option : HTMLOptionElement, memory : Uint32Array) {
  (option as any)[memorySymbol] = memory;
}

function getMemory(option : HTMLOptionElement) : Uint32Array {
  const memory = (option as any)[memorySymbol];
  if (memory instanceof Uint32Array) {
    return memory;
  } else {
    throw new Error("wtf");
  }
}

function addMemoryOption(memory : Uint32Array) : HTMLOptionElement {
  const option = document.createElement("option");
  option.innerText = memory.toString();
  setMemory(option,memory);
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
  const option = document.createElement("option");
  option.innerText = memory.toString();
  setMemory(option,memory);
  listElement.appendChild(option);
});

copyButton.addEventListener("click", () => {
  const selected = [...listElement.selectedOptions];
  selected.forEach(option => addMemoryOption(copyMemory(getMemory(option))));
});

releaseButton.addEventListener("click", () => {
  const selected = [...listElement.selectedOptions];
  selected.forEach(option => option.remove());
});