import EventEmitter from "@VoxelLib/Utility/EventEmitter";

export type InputEventMap = {
    keyup: [key: string],
    keydown: [key: string]
};

// Keys that aren't caught
const SAVED_KEYS : string[] = (() => {
    const keys : string[] = [];

    for(let i = 1; i < 21; i++) {
        keys.push(`f${i}`);
    }

    return keys;
})();


class _InputManager {
    private activeKeys : Set<string> = new Set();

    public readonly emitter : EventEmitter<InputEventMap> = new EventEmitter();

    public active = true;

    constructor() {
        window.addEventListener("keydown", ev => {
            if(!this.active) return;
            if (ev.defaultPrevented) return;
            const key = ev.key.toLowerCase();
            if(SAVED_KEYS.includes(key)) return;
            ev.preventDefault();
            if(this.activeKeys.has(key)) return;
            this.activeKeys.add(key);
            this.emitter.emit("keydown", key);
        });

        window.addEventListener("keyup", ev => {
            if(!this.active) return;
            if (ev.defaultPrevented) return;
            const key = ev.key.toLowerCase();
            if(SAVED_KEYS.includes(key)) return;
            ev.preventDefault();
            if(!this.activeKeys.has(key)) return;
            this.activeKeys.delete(key);
            this.emitter.emit("keyup", key);
        });
    }

    isKeyDown(key : string) { return this.activeKeys.has(key.toLowerCase()) };
}

const InputManager = new _InputManager();

export default InputManager;