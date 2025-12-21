import { loadAppState } from "./state/state.load.js";

loadAppState();


import { saveAppState } from "../state/state.save.js";

AppState.feedCalculator.volume = 25;
saveAppState();