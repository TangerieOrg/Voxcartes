import applyCommands from "@Game/Commands";
import FBOTestScene from "@Game/Scenes/FBOTestScene";
import GameScene from "@Game/Scenes/GameScene";
import SceneManager from "@VoxelLib/Scene/SceneManager";

applyCommands();
SceneManager.loadScene(GameScene);
SceneManager.start();