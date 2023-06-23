import {
    AmbientLight,
    CylinderGeometry,
    DirectionalLight,
    Group,
    Material,
    Mesh,
    MeshStandardMaterial,
    MeshToonMaterial,
    Object3D,
    PerspectiveCamera,
    Scene,
    Vector3,
    WebGLRenderer
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { ShapeColorIdentifier, ShapeData, ShapeIdentifier, ShapeTypeIdentifier, getShapeData } from './ShapeParser';

import CIRCLE_QUARTER_DATA from './assets/models/gltf/shapes/circle-quarter.gltf';
import RECT_QUARTER_DATA from './assets/models/gltf/shapes/rect-quarter.gltf';
import WIND_QUARTER_DATA from './assets/models/gltf/shapes/wind-quarter.gltf';
import STAR_QUARTER_DATA from './assets/models/gltf/shapes/star-quarter.gltf';
import PIN_QUARTER_DATA from './assets/models/gltf/shapes/pin-quarter.gltf';

type ShapeRendererContext = {
    renderer: WebGLRenderer,
    camera: PerspectiveCamera,
};
type ShapeQuarter = Mesh;
type ShapeQuarterMap = Record<ShapeTypeIdentifier, ShapeQuarter | undefined>;

const SHAPE: ShapeIdentifier = 'CwRwCwCw:P-P-P-P-:P-P-P-P-:CcCcCcCc';

const SHAPE_BASE_OFFSET = 0.05;
const SHAPE_MAX_LAYERS = 4;
const SHAPE_LAYER_HEIGHT = 0.1;
const SHAPE_LAYER_SCALE_FACTOR = 0.24;
const SHAPE_QUARTER_EXPAND_OFFSET = new Vector3(0.3, 0, 0.3);
const SHAPE_TYPE_REGEX = /^[CRWSP-]$/;

const SHAPE_COLOR_BASE = 0x555555;
const SHAPE_COLOR_NONE = 0x777777;
const SHAPE_COLOR_PIN = 0x444450;
const SHAPE_COLOR_RED = 0xee3333;
const SHAPE_COLOR_GREEN = 0x00ee00;
const SHAPE_COLOR_BLUE = 0x0000ee;
const SHAPE_COLOR_YELLOW = 0xeeee00;
const SHAPE_COLOR_PURPLE = 0xcc00cc;
const SHAPE_COLOR_CYAN = 0x00eeee;
const SHAPE_COLOR_WHITE = 0xfafafa;

const SHAPE_COLOR_BASE_MATERIAL = new MeshToonMaterial({ color: SHAPE_COLOR_BASE });
const SHAPE_COLOR_NONE_MATERIAL = new MeshStandardMaterial({ color: SHAPE_COLOR_NONE, vertexColors: true });
const SHAPE_COLOR_PIN_MATERIAL = new MeshToonMaterial({ color: SHAPE_COLOR_PIN, vertexColors: true });
const SHAPE_COLOR_RED_MATERIAL = new MeshToonMaterial({ color: SHAPE_COLOR_RED, vertexColors: true });
const SHAPE_COLOR_GREEN_MATERIAL = new MeshToonMaterial({ color: SHAPE_COLOR_GREEN, vertexColors: true });
const SHAPE_COLOR_BLUE_MATERIAL = new MeshToonMaterial({ color: SHAPE_COLOR_BLUE, vertexColors: true });
const SHAPE_COLOR_YELLOW_MATERIAL = new MeshToonMaterial({ color: SHAPE_COLOR_YELLOW, vertexColors: true });
const SHAPE_COLOR_PURPLE_MATERIAL = new MeshToonMaterial({ color: SHAPE_COLOR_PURPLE, vertexColors: true });
const SHAPE_COLOR_CYAN_MATERIAL = new MeshToonMaterial({ color: SHAPE_COLOR_CYAN, vertexColors: true });
const SHAPE_COLOR_WHITE_MATERIAL = new MeshToonMaterial({ color: SHAPE_COLOR_WHITE, vertexColors: true });

const SHAPE_COLOR_MATERIALS: Record<ShapeColorIdentifier, Material> = {
    r: SHAPE_COLOR_RED_MATERIAL,
    g: SHAPE_COLOR_GREEN_MATERIAL,
    b: SHAPE_COLOR_BLUE_MATERIAL,
    y: SHAPE_COLOR_YELLOW_MATERIAL,
    p: SHAPE_COLOR_PURPLE_MATERIAL,
    c: SHAPE_COLOR_CYAN_MATERIAL,
    w: SHAPE_COLOR_WHITE_MATERIAL,
    u: SHAPE_COLOR_NONE_MATERIAL,
    '-': SHAPE_COLOR_PIN_MATERIAL
};

class ShapeRenderer {
    private renderer: WebGLRenderer;
    private camera: PerspectiveCamera;
    private scene: Scene;
    private base: Object3D;
    private quarters: ShapeQuarterMap | undefined;

    private isLayerExpanded = false;
    private isQuarterExpanded = false;

    constructor(private canvas: HTMLCanvasElement, private width: number, private height: number, private pixelRatio: number = 1) {
        this.scene = new Scene();
        const lights = this.createLights();
        this.scene.add(lights);
        this.base = this.createBase();
        this.scene.add(this.base);

        this.renderer = this.createRenderer();
        this.camera = this.createCamera();

        this.update();
    }

    get isInitialized(): boolean {
        return !!this.quarters;
    }

    get context(): ShapeRendererContext {
        return {
            renderer: this.renderer,
            camera: this.camera,
        };
    }

    init(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.isInitialized) {
                return resolve();
            }

            this.getModels()
                .then(models => {
                    this.quarters = this.getQuarters(models);
                    return resolve();
                })
                .catch(reject);
        });
    }

    resize(width: number, height: number, pixelRatio: number = 1) {
        this.width = width;
        this.height = height;
        this.pixelRatio = pixelRatio;

        this.onResize();
    }

    draw(identifier: ShapeIdentifier = SHAPE) {
        if (!this.isInitialized) {
            throw getError('draw', 'Not initialized');
        }

        this.clear();
        const shapeData = getShapeData(identifier);
        this.drawShape(shapeData);
    }

    clear() {
        this.base.children.forEach(layer => layer.children = []);
    }

    expandLayers() {
        if (this.isLayerExpanded) return;

        this.isLayerExpanded = true;
        this.base.children.forEach((layer, layerIndex) => {
            layer.position.y += (layerIndex + 1) * SHAPE_LAYER_HEIGHT;
        });
    }

    collapseLayers() {
        if (!this.isLayerExpanded) return;

        this.isLayerExpanded = false;
        this.base.children.forEach((layer, layerIndex) => {
            layer.position.y -= (layerIndex + 1) * SHAPE_LAYER_HEIGHT;
        });
    }

    expandQuarters() {
        if (this.isQuarterExpanded) return;

        this.isQuarterExpanded = true;
        this.base.children.forEach((layer, layerIndex) => {
            layer.children.forEach(quarter => {
                const offset = SHAPE_QUARTER_EXPAND_OFFSET
                    .clone()
                    .applyQuaternion(quarter.quaternion)
                    .multiplyScalar((layerIndex + 1) * SHAPE_LAYER_SCALE_FACTOR);
                quarter.position.add(offset);
            });
        });
    }

    collapseQuarters() {
        if (!this.isQuarterExpanded) return;

        this.isQuarterExpanded = false;
        this.base.children.forEach((layer, layerIndex) => {
            layer.children.forEach(quarter => {
                const offset = SHAPE_QUARTER_EXPAND_OFFSET
                    .clone()
                    .applyQuaternion(quarter.quaternion)
                    .multiplyScalar((layerIndex + 1) * SHAPE_LAYER_SCALE_FACTOR);
                quarter.position.sub(offset);
            });
        });
    }

    private createRenderer(canvas = this.canvas, width = this.width, height = this.height, pixelRatio = this.pixelRatio): WebGLRenderer {
        const renderer = new WebGLRenderer({
            alpha: true,
            antialias: true,
            canvas,
        });
        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(width, height);
        return renderer;
    }

    private createCamera(width = this.width, height = this.height): PerspectiveCamera {
        const camera = new PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.y = 2;
        camera.position.z = 1.5;
        return camera;
    }

    private createLights(): Object3D {
        const lights = new Group();
        const ambientLight = new AmbientLight(0xffffff, 0.1);
        lights.add(ambientLight);

        const directionalLight = new DirectionalLight(0xffffff, 0.9);
        directionalLight.position.set(1, 3, 1);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        lights.add(directionalLight);
        return lights;
    }

    private createBase(): Object3D {
        const geometry = new CylinderGeometry(0.55, 0.55, 0.1, 32);
        const base = new Mesh(geometry, SHAPE_COLOR_BASE_MATERIAL);
        base.position.y = -SHAPE_BASE_OFFSET;
        base.rotateY(Math.PI * 0.5);
        base.receiveShadow = true;
        for (let i = 0; i < SHAPE_MAX_LAYERS; i++) {
            const layer = new Group();
            layer.position.y = i * SHAPE_LAYER_HEIGHT + SHAPE_BASE_OFFSET;
            layer.scale.x = 1 - i * SHAPE_LAYER_SCALE_FACTOR;
            layer.scale.z = 1 - i * SHAPE_LAYER_SCALE_FACTOR;
            base.add(layer);
        }
        return base;
    }

    private update() {
        requestAnimationFrame(() => this.update());

        this.renderer.render(this.scene, this.camera);
    }

    private getModels(): Promise<Array<Mesh>> {
        return new Promise<Array<Mesh>>((resolve, reject) => {
            const loader = new GLTFLoader();

            Promise.all([
                loader.loadAsync(CIRCLE_QUARTER_DATA),
                loader.loadAsync(RECT_QUARTER_DATA),
                loader.loadAsync(WIND_QUARTER_DATA),
                loader.loadAsync(STAR_QUARTER_DATA),
                loader.loadAsync(PIN_QUARTER_DATA),
            ])
                .then(values => resolve(values.map((value) => value.scene.children[0] as Mesh)))
                .catch(reason => reject(getError('getModels', reason.toString())));
        });
    }

    private getQuarters(models: Array<ShapeQuarter>): ShapeQuarterMap {
        const quarters: ShapeQuarterMap = {
            C: models[0],
            R: models[1],
            W: models[2],
            S: models[3],
            P: models[4],
            '-': undefined
        };
        return quarters;
    }

    private onResize() {
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(this.pixelRatio);
    }

    private drawShape(shape: ShapeData) {
        let currentLayerIndex = 0;
        shape.layers.forEach(layerData => {
            const shapeLayer = this.getLayer(currentLayerIndex++);
            layerData.quarters.forEach((quarterData, quarterDataIndex) => {
                const quarter = this.getQuarter(quarterData.type);
                if (!quarter) return;

                const shapeQuarter = quarter.clone();
                shapeQuarter.rotateY(Math.PI * -0.5 * quarterDataIndex);
                const material = SHAPE_COLOR_MATERIALS[quarterData.color];
                shapeQuarter.material = material;

                shapeLayer.add(shapeQuarter);
            });
        });
    }

    private getLayer(index: number): Object3D {
        return this.base.children[index];
    }

    private getQuarter(type: ShapeTypeIdentifier): ShapeQuarter | undefined {
        if (!this.quarters) {
            throw getError('getQuarter', 'Quarters not available');
        }
        if (!type.match(SHAPE_TYPE_REGEX)) {
            throw getError('getQuarter', `Invalid shape type: ${type}`);
        }
        return this.quarters[type];
    }
}

const getError = (meta: string, message: string) => new Error(`[SHAPE-RENDERER] ${meta} - ${message}`);

export default ShapeRenderer;
