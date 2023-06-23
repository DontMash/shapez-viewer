import WebGL from 'three/examples/jsm/capabilities/WebGL';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ShapeIdentifier } from './ShapeParser';
import ShapeRenderer from './ShapeRenderer';

const SHAPE: ShapeIdentifier = 'CwRwCwCw:P-P-P-P-:P-P-P-P-:CcCcCcCc';

class ShapeViewer {
    private renderer: ShapeRenderer;
    private controls: OrbitControls;

    constructor(private canvas: HTMLCanvasElement) {
        if (!WebGL.isWebGLAvailable()) {
            throw getError('create', 'WebGL is not supported');
        }

        this.renderer = new ShapeRenderer(canvas, this.width, this.height, window.devicePixelRatio);
        this.controls = this.createControls();

        const resizeObserver = new ResizeObserver(() => this.onResize());
        resizeObserver.observe(this.canvas.parentElement ?? document.body);

        this.update();
    }

    get width(): number {
        return this.canvas.parentElement ? this.canvas.parentElement.clientWidth : window.innerWidth;
    }

    get height(): number {
        return this.canvas.parentElement ? this.canvas.parentElement.clientHeight : window.innerHeight;
    }

    get isInitialized(): boolean {
        return this.renderer.isInitialized;
    }

    init(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.isInitialized) {
                return resolve();
            }

            this.renderer.init()
                .then(resolve)
                .catch(reject);
        });
    }

    draw(identifier: ShapeIdentifier = SHAPE) {
        if (!this.isInitialized) {
            throw getError('draw', 'Not initialized');
        }

        this.renderer.draw(identifier);
    }

    expandLayers() {
        this.renderer.expandLayers();
    }
    collapseLayers() {
        this.renderer.collapseLayers();
    }
    expandQuarters() {
        this.renderer.expandQuarters();
    }
    collapseQuarters() {
        this.renderer.collapseQuarters();
    }

    private createControls(camera = this.renderer.context.camera, renderer = this.renderer.context.renderer): OrbitControls {
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = false;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 1.5;
        controls.maxDistance = 3;
        controls.maxPolarAngle = Math.PI * 0.4;
        return controls;
    }

    private update() {
        requestAnimationFrame(() => this.update());

        this.controls.update();
    }

    private onResize() {
        this.renderer.resize(this.width, this.height, window.devicePixelRatio);
    }
}

const getError = (meta: string, message: string) => new Error(`[SHAPE-VIEWER] ${meta} - ${message}`);

export default ShapeViewer;
