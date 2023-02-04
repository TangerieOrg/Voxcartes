import { Regl } from "regl";
import { createRegl } from "..";
import Scene from "./Scene";
import "../Debug/DebugConsole/DebugConsole";

const SceneManager = new (class SceneManager {

    isDebug : boolean;
    regl : Regl;
    currentScene? : Scene;

    constructor() {
        // @ts-ignore
        this.isDebug = process.env.NODE_ENV === "development";

        if(this.isDebug) {
            this.regl = createRegl({
                profile: true,
                extensions: ["EXT_disjoint_timer_query"]
            })
        } else {
            this.regl = createRegl();
        }
    }

    loadScene(scene : typeof Scene) {
        this.currentScene?.onUnload();
        this.currentScene = new scene(this.regl);
        this.currentScene.onLoad();
    }

    start() {
        if(this.currentScene) {
            this.currentScene.renderer.onFrame = ctxt => this.currentScene?.onFrame(ctxt);
            this.currentScene.renderer.start();
        }
    }

})();

export default SceneManager;