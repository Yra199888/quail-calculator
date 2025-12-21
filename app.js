import { loadAppState } from "./state/state.load.js";

loadAppState();


import { saveAppState } from "../state/state.save.js";

AppState.feedCalculator.volume = 25;
saveAppState();

import { $, qs, qsa } from "../utils/dom.js";

const btn = $("makeFeedBtn");
const rows = qsa(".qty");

import { uid } from "../utils/uid.js";

const id = uid("recipe_");

import { required } from "../utils/validators.js";

if (!required(client)) {
  toast("Вкажи клієнта", "warn");
}