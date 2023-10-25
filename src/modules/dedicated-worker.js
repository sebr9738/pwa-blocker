// dedicated-worker.js
import { giveMePi } from "./madhava-leibniz.js";

self.addEventListener("message", (event) => {
  if (event.data === "start") {
    // Hier wird die Berechnung durchgeführt
    const guess = giveMePi(5);
    self.postMessage({ pi: guess.pi, piMin: guess.piMin, piMax: guess.piMax });
  }
});
