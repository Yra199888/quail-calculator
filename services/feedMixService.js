// src/services/feedMixService.js
import { uid } from "../utils/uid.js";

export function addFeedMix(AppState, payload) {
  AppState.feedMixes.history.unshift({
    id: uid("mix_"),
    createdAt: new Date().toISOString(),
    ...payload
  });
}

export function deleteFeedMix(AppState, id) {
  AppState.feedMixes.history =
    AppState.feedMixes.history.filter(x => x.id !== id);
}