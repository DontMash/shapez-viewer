import { ShapeIdentifier, getShapeData } from './ShapeParser';
import MultiShapeViewer, { ShapeView } from './MultiShapeViewer';
import { SHAPE, SHAPE_LAYER_HEIGHT, SHAPE_LAYER_SCALE_FACTOR, SHAPE_QUARTER_EXPAND_OFFSET } from './const';

class ShapeViewer extends MultiShapeViewer {
    private view: ShapeView;

    private isLayerExpanded = false;
    private isQuarterExpanded = false;

    constructor(canvas: HTMLCanvasElement) {
        super(canvas, [{ shape: SHAPE, element: canvas }], window.devicePixelRatio);

        this.view = this.views[0];
        this.view.camera.position.y = 2;
        this.view.camera.position.z = 1.5;
    }

    get width(): number {
        return this.canvas.offsetParent ? this.canvas.offsetParent.clientWidth : window.innerWidth;
    }

    get height(): number {
        return this.canvas.offsetParent ? this.canvas.offsetParent.clientHeight : window.innerHeight;
    }

    assign(identifier: ShapeIdentifier = SHAPE) {
        if (!this.isInitialized) {
            throw getError('assign', 'Not initialized');
        }

        this.clear();
        this.view.data = getShapeData(identifier);
        this.assignShape(this.view);
    }

    clear() {
        this.view.base.children.forEach(layer => layer.children.forEach(quarter => quarter.children = []));
    }

    expandLayers() {
        if (this.isLayerExpanded) return;

        this.isLayerExpanded = true;
        this.view.base.children.forEach((layer, layerIndex) => {
            layer.position.y += (layerIndex + 1) * SHAPE_LAYER_HEIGHT;
        });
    }

    collapseLayers() {
        if (!this.isLayerExpanded) return;

        this.isLayerExpanded = false;
        this.view.base.children.forEach((layer, layerIndex) => {
            layer.position.y -= (layerIndex + 1) * SHAPE_LAYER_HEIGHT;
        });
    }

    expandQuarters() {
        if (this.isQuarterExpanded) return;

        this.isQuarterExpanded = true;
        this.view.base.children.forEach((layer, layerIndex) => {
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
        this.view.base.children.forEach((layer, layerIndex) => {
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

const getError = (meta: string, message: string) => new Error(`[SHAPE-VIEWER] ${meta} - ${message}`);

export default ShapeViewer;
