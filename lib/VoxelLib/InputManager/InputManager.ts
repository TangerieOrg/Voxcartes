import EventEmitter from "@VoxelLib/Utility/EventEmitter";

export type InputEventMap = {
    keyup: [key: string],
    keydown: [key: string]
};

class _InputManager {
    private activeKeys : Set<string> = new Set();

    public readonly emitter : EventEmitter<InputEventMap> = new EventEmitter();

    constructor() {
        window.addEventListener("keydown", ev => {
            if (ev.defaultPrevented) return;
            ev.preventDefault()
            const key = ev.key.toLowerCase();
            if(this.activeKeys.has(key)) return;
            this.activeKeys.add(key);
            this.emitter.emit("keydown", key);
        });

        window.addEventListener("keyup", ev => {
            if (ev.defaultPrevented) return;
            ev.preventDefault();
            const key = ev.key.toLowerCase();
            if(!this.activeKeys.has(key)) return;
            this.activeKeys.delete(key);
            this.emitter.emit("keyup", key);
        });
    }

    isKeyDown(key : string) { return this.activeKeys.has(key.toLowerCase()) };
}

const InputManager = new _InputManager();

export default InputManager;