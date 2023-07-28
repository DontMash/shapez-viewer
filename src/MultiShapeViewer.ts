import {
    AmbientLight,
    Camera,
    CylinderGeometry,
    DirectionalLight,
    Group,
    Mesh,
    Object3D,
    PerspectiveCamera,
    Scene
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ShapeData, ShapeIdentifier, ShapeTypeIdentifier, getShapeData } from './ShapeParser';
import MultiShapeRenderer from './MultiShapeRenderer';
import {
    SHAPE_BASE_OFFSET,
    SHAPE_COLOR_BASE_MATERIAL,
    SHAPE_COLOR_CRYSTAL_MATERIAL,
    SHAPE_COLOR_MATERIALS,
    SHAPE_LAYER_HEIGHT,
    SHAPE_LAYER_SCALE_FACTOR,
    SHAPE_MAX_LAYERS,
    SHAPE_MAX_QUARTERS
} from './const';

import CIRCLE_QUARTER_DATA from './assets/models/gltf/shapes/circle-quarter.gltf';
import RECT_QUARTER_DATA from './assets/models/gltf/shapes/rect-quarter.gltf';
import WIND_QUARTER_DATA from './assets/models/gltf/shapes/wind-quarter.gltf';
import STAR_QUARTER_DATA from './assets/models/gltf/shapes/star-quarter.gltf';
import PIN_QUARTER_DATA from './assets/models/gltf/shapes/pin-quarter.gltf';
import WebGL from 'three/examples/jsm/capabilities/WebGL';

export type ShapeViewOption = {
    element: HTMLElement,
    shape: ShapeIdentifier,
};
export type ShapeView = {
    element: HTMLElement,
    camera: PerspectiveCamera,
    controls: OrbitControls,
    scene: Scene,
    base: Object3D,
    data: ShapeData,
};
type ShapeQuarter = Mesh;
type ShapeQuarterMap = Record<ShapeTypeIdentifier, ShapeQuarter | undefined>;

class MultiShapeViewer {
    protected views: Array<ShapeView>;

    private renderer: MultiShapeRenderer;
    private quarters: ShapeQuarterMap | undefined;

    constructor(protected canvas: HTMLCanvasElement, viewOptions: Array<ShapeViewOption>) {
        if (!WebGL.isWebGLAvailable()) {
            throw getError('create', 'WebGL is not supported');
        }
        if (viewOptions.length <= 0) {
            throw getError('constructor', 'No views defined');
        }

        this.renderer = new MultiShapeRenderer(this.canvas, this.width, this.height, window.devicePixelRatio);
        this.views = viewOptions.map<ShapeView>(option => {
            const camera = this.createCamera();
            const controls = this.createControls(camera, option.element);
            const scene = new Scene();
            const lights = this.createLights();
            scene.add(lights);
            const base = this.createBase();
            scene.add(base);
            const data = getShapeData(option.shape);

            return { element: option.element, camera, controls, scene, base, data };
        });

        const resizeObserver = new ResizeObserver(() => this.onResize());
        resizeObserver.observe(this.canvas.parentElement ?? document.body);

        this.update();
    }

    get isInitialized(): boolean {
        return !!this.quarters;
    }
    get width(): number {
        return this.canvas.parentElement ? this.canvas.parentElement.scrollWidth : window.innerWidth;
    }
    get height(): number {
        return this.canvas.parentElement ? this.canvas.parentElement.scrollHeight : window.innerHeight;
    }

    init(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.isInitialized) {
                return resolve();
            }

            this.getModels()
                .then(models => {
                    this.quarters = this.getQuarters(models);
                    this.views.forEach(view => {
                        this.assignShape(view);
                    });
                    return resolve();
                })
                .catch(reject);
        });
    }

    private createCamera(): PerspectiveCamera {
        const camera = new PerspectiveCamera(55, 1, 0.1, 10);
        camera.position.y = 0.9;
        camera.position.z = 0.9;
        return camera;
    }

    private createLights(): Object3D {
        const lights = new Group();
        const ambientLight = new AmbientLight(0xffffff, 1);
        lights.add(ambientLight);

        const directionalLight = new DirectionalLight(0xffffff, 2);
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
            for (let k = 0; k < SHAPE_MAX_QUARTERS; k++) {
                const quarter = new Group();
                quarter.rotateY(Math.PI * -0.5 * k);
                layer.add(quarter);
            }
            base.add(layer);
        }
        return base;
    }

    private createControls(camera: Camera, element: HTMLElement): OrbitControls {
        const controls = new OrbitControls(camera, element);
        controls.enablePan = false;
        controls.enableZoom = false;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI * 0.4;
        return controls;
    }

    private update() {
        requestAnimationFrame(() => this.update());

        const elements = this.views.filter(view => {
            const rect = view.element.getBoundingClientRect();
            return rect.top < window.innerHeight && rect.bottom > 0 && rect.left < window.innerWidth && rect.right > 0;
        }).map(view => {
            view.controls.update();

            return {
                scene: view.scene,
                camera: view.camera,
                data: view.data,
                top: view.element.offsetTop,
                left: view.element.offsetLeft,
                width: view.element.offsetWidth,
                height: view.element.offsetHeight,
            };
        });
        this.renderer.update(elements);
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
            c: models[0],
            '-': undefined
        };
        return quarters;
    }

    private onResize() {
        this.views.forEach(view => {
            const width = view.element.clientWidth;
            const height = view.element.clientHeight;
            view.camera.aspect = width / height;
            view.camera.updateProjectionMatrix();
        });

        this.renderer.resize(this.width, this.height, window.devicePixelRatio);
    }

    protected assignShape(view: ShapeView) {
        const shape = view.data;
        shape.layers.forEach((layerData, layerDataIndex) => {
            layerData.quarters.forEach((quarterData, quarterDataIndex) => {
                const quarter = this.getQuarter(quarterData.type);
                if (!quarter) return;

                const shapeQuarter = quarter.clone();
                const material = quarterData.type === 'c' ? SHAPE_COLOR_CRYSTAL_MATERIAL : SHAPE_COLOR_MATERIALS[quarterData.color];
                shapeQuarter.material = material;

                this.assignQuarter(view, shapeQuarter, layerDataIndex, quarterDataIndex);
            });
        });
    }

    private assignQuarter(view: ShapeView, shapeQuarter: ShapeQuarter, layerIndex: number, quarterIndex: number) {
        if (layerIndex < 0 || layerIndex > 3)
            throw getError('assignQuarter', `Invalid layerIndex ${layerIndex}`);
        if (quarterIndex < 0 || quarterIndex > 3)
            throw getError('assignQuarter', `Invalid quarterIndex ${quarterIndex}`);

        const layer = view.base.children[layerIndex];
        const quarter = layer.children[quarterIndex];
        quarter.add(shapeQuarter);
    }

    private getQuarter(type: ShapeTypeIdentifier): ShapeQuarter | undefined {
        if (!this.quarters) {
            throw getError('getQuarter', 'Quarters not available');
        }
        return this.quarters[type];
    }
}

const getError = (meta: string, message: string) => new Error(`[MULTI-SHAPE-VIEWER] ${meta} - ${message}`);

export default MultiShapeViewer;
