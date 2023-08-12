import {
    AmbientLight,
    CylinderGeometry,
    DirectionalLight,
    Group,
    Mesh,
    Object3D,
    PerspectiveCamera,
    Scene
} from 'three';
import {
    ShapeData,
    ShapeIdentifier,
    ShapeLayerIndex,
    ShapeQuarter,
    ShapeQuarterIndex,
    ShapeQuarterMap,
    getQuarters,
    getShapeData
} from './ShapeParser';
import {
    SHAPE,
    SHAPE_BASE_OFFSET,
    SHAPE_COLOR_BASE_MATERIAL,
    SHAPE_COLOR_CRYSTAL_MATERIAL,
    SHAPE_COLOR_MATERIALS,
    SHAPE_LAYER_HEIGHT,
    SHAPE_LAYER_SCALE_FACTOR,
    SHAPE_MAX_LAYERS,
    SHAPE_MAX_QUARTERS,
    SHAPE_QUARTER_EXPAND_OFFSET
} from './const';

class ShapeView {
    private _camera: PerspectiveCamera;
    private _scene: Scene;
    private _base: Object3D;
    private _data: ShapeData;

    private quarterMap: ShapeQuarterMap | undefined;
    private isLayerExpanded = false;
    private isQuarterExpanded = false;

    constructor(
        identifier: ShapeIdentifier = SHAPE,
        private _top: number = 0,
        private _left: number = 0,
        private _width: number = 256,
        private _height: number = 256,
    ) {
        this._camera = this.createCamera(_width, _height);
        this._scene = new Scene();
        const lights = this.createLights();
        this.scene.add(lights);
        this._base = this.createBase();
        this.scene.add(this._base);
        this._data = getShapeData(identifier);
    }

    get isInitialized(): boolean {
        return !!this.quarterMap;
    }

    get camera(): PerspectiveCamera {
        return this._camera;
    }
    get scene(): Scene {
        return this._scene;
    }
    get data(): ShapeData {
        return this._data;
    }

    get top(): number {
        return this._top;
    }
    get left(): number {
        return this._left;
    }
    get width(): number {
        return this._width;
    }
    get height(): number {
        return this._height;
    }

    init(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.isInitialized) {
                return resolve();
            }

            getQuarters()
                .then(quarters => {                    
                    this.quarterMap = quarters;
                    this.update();
                    return resolve();
                })
                .catch(reject);
        });
    }

    private createCamera(width: number, height: number): PerspectiveCamera {
        const camera = new PerspectiveCamera(55, width / height, 0.1, 10);
        camera.position.y = 0.9;
        camera.position.z = 0.9;
        camera.lookAt(0, 0, 0);
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

    transform(top: number, left: number, width: number, height: number) {
        this._top = top;
        this._left = left;
        this._width = width;
        this._height = height;

        this.resize();
    }

    private resize() {
        this._camera.aspect = this._width / this._height;
        this._camera.updateProjectionMatrix();
    }

    update(identifier?: ShapeIdentifier) {
        if (identifier) {
            this.clear();
            this._data = getShapeData(identifier);
        }

        this.updateShape();
    }

    clear() {
        this._base.children.forEach(layer => layer.children.forEach(quarter => quarter.children = []));
    }

    private updateShape() {
        if (!this.isInitialized) {
            throw getError('updateShape', 'Not initialized');
        }

        this._data.layers.forEach((layerData, layerDataIndex) => {
            layerData.quarters.forEach((quarterData, quarterDataIndex) => {
                const quarter = this.quarterMap![quarterData.type];

                if (!quarter) return;

                const shapeQuarter = quarter.clone();
                const material = quarterData.type === 'c' ? SHAPE_COLOR_CRYSTAL_MATERIAL : SHAPE_COLOR_MATERIALS[quarterData.color];
                shapeQuarter.material = material;

                this.assignQuarter(shapeQuarter, layerDataIndex as ShapeLayerIndex, quarterDataIndex as ShapeQuarterIndex);
            });
        });
    }

    private assignQuarter(shapeQuarter: ShapeQuarter, layerIndex: ShapeLayerIndex, quarterIndex: ShapeQuarterIndex) {
        if (layerIndex < 0 || layerIndex > 3)
            throw getError('assignQuarter', `Invalid layerIndex ${layerIndex}`);
        if (quarterIndex < 0 || quarterIndex > 3)
            throw getError('assignQuarter', `Invalid quarterIndex ${quarterIndex}`);

        const layer = this._base.children[layerIndex];
        const quarter = layer.children[quarterIndex];
        quarter.add(shapeQuarter);
    }

    expandLayers() {
        if (this.isLayerExpanded) return;

        this.isLayerExpanded = true;
        this._base.children.forEach((layer, layerIndex) => {
            layer.position.y += (layerIndex + 1) * SHAPE_LAYER_HEIGHT;
        });
    }

    collapseLayers() {
        if (!this.isLayerExpanded) return;

        this.isLayerExpanded = false;
        this._base.children.forEach((layer, layerIndex) => {
            layer.position.y -= (layerIndex + 1) * SHAPE_LAYER_HEIGHT;
        });
    }

    expandQuarters() {
        if (this.isQuarterExpanded) return;

        this.isQuarterExpanded = true;
        this._base.children.forEach((layer, layerIndex) => {
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
        this._base.children.forEach((layer, layerIndex) => {
            layer.children.forEach(quarter => {
                const offset = SHAPE_QUARTER_EXPAND_OFFSET
                    .clone()
                    .applyQuaternion(quarter.quaternion)
                    .multiplyScalar((layerIndex + 1) * SHAPE_LAYER_SCALE_FACTOR);
                quarter.position.sub(offset);
            });
        });
    }
}

const getError = (meta: string, message: string) => new Error(`[SHAPE-VIEW] ${meta} - ${message}`);

export default ShapeView;
