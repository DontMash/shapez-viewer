import { ShapeIdentifier } from './ShapeParser';
import MultiShapeViewer, { ShapeViewItem } from './MultiShapeViewer';
import { SHAPE } from './const';

class ShapeViewer extends MultiShapeViewer {
    private item: ShapeViewItem;

    constructor(canvas: HTMLCanvasElement) {
        super(canvas, [{ shape: SHAPE, element: canvas }]);

        this.renderer.pixelRatio = window.devicePixelRatio;
        this.item = this.items[0];
        this.item.view.camera.position.y = 2;
        this.item.view.camera.position.z = 1.5;
    }

    get width(): number {
        return this.canvas.offsetParent ? this.canvas.offsetParent.clientWidth : window.innerWidth;
    }

    get height(): number {
        return this.canvas.offsetParent ? this.canvas.offsetParent.clientHeight : window.innerHeight;
    }

    assign(identifier: ShapeIdentifier = SHAPE) {        
        this.item.view.update(identifier);
    }

    expandLayers() {
        this.item.view.expandLayers();
    }

    collapseLayers() {
        this.item.view.collapseLayers();
    }

    expandQuarters() {
        this.item.view.expandQuarters();
    }

    collapseQuarters() {
        this.item.view.collapseQuarters();
    }
}

export default ShapeViewer;
