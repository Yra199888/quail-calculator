import { loadLocal } from "./core/storage.js";
import { renderAll } from "./modules/render.js";
import { initDrive } from "./core/drive.js";

initDrive();
loadLocal();
renderAll();