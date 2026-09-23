/*
 * Sound effects are disabled. Every function below keeps the same name and
 * signature that the rest of the app expects, so nothing else needs to
 * change - they just don't produce any audio.
 */

let muted = true;

const listeners = new Set();

export const isMuted = () => muted;

export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/** Call from a click / key press. No-op: there is no audio engine to start. */
export const unlock = () => false;

export const setMuted = (value) => {
  muted = value;
  listeners.forEach((fn) => fn(muted));
};

/* ---------- the sounds (all silent) ---------- */

/** Terminal line */
export const tick = () => {};

/** Riser: returns a stopper, same as before, but there is nothing to stop */
export const riser = () => () => {};

/** Whoosh */
export const whoosh = () => {};

/** A CIPHER letter locking in */
export const lock = () => {};

/** The big two-note "tu-dum" as the shutters open */
export const hit = () => {};

/** Pointer moves onto a link or button */
export const hover = () => {};

/** Click / press */
export const click = () => {};

/* ---------- UI sounds for the whole page ---------- */

/** No sounds are attached; returns a no-op cleanup function to match the old API */
export const attachUiSounds = () => () => {};
