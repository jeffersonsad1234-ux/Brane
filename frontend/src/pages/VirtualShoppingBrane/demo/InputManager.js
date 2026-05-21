export default class InputManager {
  constructor() {
    this.keys = {};
    this.justPressedKeys = {};
    this._onDown = (e) => {
      if (!this.keys[e.code]) this.justPressedKeys[e.code] = true;
      this.keys[e.code] = true;
    };
    this._onUp = (e) => {
      this.keys[e.code] = false;
    };
    document.addEventListener("keydown", this._onDown);
    document.addEventListener("keyup", this._onUp);
  }

  isDown(code) {
    return !!this.keys[code];
  }

  justPressed(code) {
    return !!this.justPressedKeys[code];
  }

  clearFrame() {
    this.justPressedKeys = {};
  }

  destroy() {
    document.removeEventListener("keydown", this._onDown);
    document.removeEventListener("keyup", this._onUp);
  }
}
