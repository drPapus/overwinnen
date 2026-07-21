import { AnatomyCanvas } from "./anatomy-canvas.js";
import { hipConfig, kneeConfig, neckConfig, shoulderConfig, spineConfig } from "./anatomy-configs.js";

const canvas = document.querySelector("#anatomy-canvas");
const configs = { hip: hipConfig, knee: kneeConfig, neck: neckConfig, shoulder: shoulderConfig, spine: spineConfig };
const config = canvas ? configs[canvas.dataset.anatomyModel] : null;

if (canvas && config) {
  const anatomyCanvas = new AnatomyCanvas({ canvas, ...config }).init();
  window.addEventListener("pagehide", () => anatomyCanvas.destroy(), { once: true });
}
