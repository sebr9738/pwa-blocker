// shared-worker.js
import { giveMePi } from "./madhava-leibniz.js";

const ports = new Set();

function broadcastMessage(data) {
  for (const port of ports) {
      try {
          port.postMessage(data);
      } catch (error) {
          ports.delete(port);
      }
  }
}

function handleMessage(event) {
  broadcastMessage("start")
  let guess = giveMePi(event.data);
  broadcastMessage(guess);
}

onconnect = function (e) {
  const port = e.ports[0];
  port.onmessage = handleMessage;
  ports.add(port);
};

onerror = (errorEvent) => {
  console.debug(`Error in sharedWorker: ${errorEvent.message}`);
};