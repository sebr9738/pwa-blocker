import { giveMePi } from "./modules/madhava-leibniz.js";

const TIME_FORMAT = Intl.DateTimeFormat("de-DE", {
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
});

/* HTML element IDs */
const EXECUTION_MODE_ID = "executionMode";
const CLOCK_ID = "clock";
const COUNTER_ID = "counter";
const BLOCKER_ID = "blocker";
const INC_COUNTER_ID = "incCounter";
const RUN_BLOCKER_ID = "runBlocker";
const PI_ID = "pi";

function sharedWorkerCallback(event) {
  if (event.data === "start") {
    signalRunningState();
  } else {
    signalIdleState(event.data);
  }
}

let dedicatedWorker;
let sharedWorker;
if (window.Worker) {
  dedicatedWorker = new Worker(
    new URL("./modules/dedicated-worker.js", import.meta.url),
    {
      type: "module",
      name: "dedicated worker",
    }
  );

  dedicatedWorker.onmessage = (e) => {
    const message = e.data;
    if (message.pi) {
      signalIdleState(message);
    }
  };
}

if (window.SharedWorker) {
  sharedWorker = new SharedWorker(
    new URL("data-url:./modules/shared-worker.js", import.meta.url),
    {
      type: "module",
      name: "shared worker",
    }
  );

  sharedWorker.port.onmessage = sharedWorkerCallback;
}

/**
 * Update UI to state "running"
 */
function signalRunningState() {
  const blockerElem = document.getElementById(BLOCKER_ID);
  blockerElem.innerHTML = "running";
  blockerElem.className = "running";
}

/**
 * Show the approximate value for π and update UI to state "idle".
 * @param {*} guess
 */
function signalIdleState(guess) {
  console.log(
    `We know π ≅ ${guess.pi} bounded by [${guess.piMin}, ${guess.piMax}]`
  );

  //update UI
  const blockerElem = document.getElementById(BLOCKER_ID);
  const piElem = document.getElementById(PI_ID);
  blockerElem.innerHTML = "idle";
  blockerElem.className = "idle";
  piElem.innerHTML = `π ≅ ${guess.pi}`;
}

function incCounter() {
  var counter = document.getElementById(COUNTER_ID);
  var value = Number(counter.innerHTML) + 1;
  counter.innerHTML = value;
}

function runBlocker(seconds) {
  signalRunningState();
  setTimeout(() => {
    block(5.0);
  }, 100); /* 100ms seams to be a reasonable delay for the browser to update the blockerElem */
}

function block(seconds) {
  const execElem = document.getElementById(EXECUTION_MODE_ID);
  const executionMode = execElem.options[execElem.selectedIndex].text;

  if (executionMode === "shared worker") {
    // Starte den Shared Worker, um die Berechnung durchzuführen
    sharedWorker.port.postMessage(seconds);
  } else if (executionMode === "dedicated worker") {
    // Starte den Dedicated Worker, um die Berechnung durchzuführen
    dedicatedWorker.postMessage("start");
  } else {
    /* progressive degrade to single threaded behavior */
    let guess = giveMePi(5);
    signalIdleState(guess);
  }
}

//Implementation of a clock.
//The display of time fades in and out, which is realized by changing the css class.
var toggle = true;
var localTime = TIME_FORMAT.format(new Date());
function updateClock() {
  const now = TIME_FORMAT.format(new Date());
  if (now !== localTime) {
    localTime = now;
    const clockElem = document.getElementById(CLOCK_ID);
    clockElem.innerHTML = localTime;
    if (toggle) {
      clockElem.classList.add("fade");
    } else {
      clockElem.classList.remove("fade");
    }
    toggle = !toggle;
  }
}

/* set up to user interface */
document.getElementById(CLOCK_ID).innerHTML = localTime;
document.getElementById(INC_COUNTER_ID).addEventListener("click", incCounter);
document
  .getElementById(RUN_BLOCKER_ID)
  .addEventListener("click", () => runBlocker(5.0));

// run updateClock periodically
setInterval(updateClock, 19);