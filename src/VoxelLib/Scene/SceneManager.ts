import { Regl } from "regl";
import { createRegl } from "..";
import Scene from "./Scene";

const SceneManager = new (class SceneManager {
    regl : Regl = createRegl();
    currentScene? : Scene;

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