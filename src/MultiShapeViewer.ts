import {
    Camera
} from 'three';
import WebGL from 'three/examples/jsm/capabilities/WebGL';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ShapeIdentifier } from './ShapeParser';
import ShapeRenderer from './ShapeRenderer';
import ShapeView from './ShapeView';

export type ShapeViewOption = {
    element: HTMLElement,
    shape: ShapeIdentifier,
};
export type ShapeViewItem = {
    element: HTMLElement,
    controls: OrbitControls,
    view: ShapeView,
};

class MultiShapeViewer {
    protected items: Array<ShapeViewItem>;
    protected renderer: ShapeRenderer;

    constructor(protected canvas: HTMLCanvasElement, viewOptions: Array<ShapeViewOption>) {
        if (!WebGL.isWebGLAvailable()) {
            throw getError('create', 'WebGL is not supported');
        }
        if (viewOptions.length <= 0) {
            throw getError('constructor', 'No views defined');
        }

        this.renderer = new ShapeRenderer(this.canvas, this.width, this.height);
        this.items = viewOptions.map<ShapeViewItem>(option => {
            const top = option.element.offsetTop;
            const left = option.element.offsetLeft;
            const width = option.element.clientWidth;
            const height = option.element.clientHeight;
            const view = new ShapeView(option.shape, top, left, width, height);
            const controls = this.createControls(view.camera, option.element);

            return { element: option.element, controls, view };
        });

        const resizeObserver = new ResizeObserver(() => this.onResize());
        resizeObserver.observe(this.canvas.parentElement ?? document.body);
    }

    get isInitialized(): boolean {
        return this.items.reduce<boolean>((result, current) => {
            return result && current.view.isInitialized;
        }, true);
    }
    get width(): number {
        return this.canvas.offsetParent ? this.canvas.offsetParent.scrollWidth : window.innerWidth;
    }
    get height(): number {
        return this.canvas.offsetParent ? this.canvas.offsetParent.scrollHeight : window.innerHeight;
    }

    init(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.isInitialized) return resolve();

            const promises = this.items.map(item => item.view.init());
            Promise.all(promises).then(() => {
                this.update();                
                return resolve();
            }).catch(reject);
        });
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

        const views = this.items
            .filter(item => {
                const rect = item.element.getBoundingClientRect();
                return rect.top < window.innerHeight &&
                    rect.bottom > 0 &&
                    rect.left < window.innerWidth &&
                    rect.right > 0;
            })
            .map(item => {
                item.controls.update();
                return item.view;
            });
        this.renderer.update(views);
    }

    private onResize() {
        this.items.forEach(item => {
            const top = item.element.offsetTop;
            const left = item.element.offsetLeft;
            const width = item.element.clientWidth;
            const height = item.element.clientHeight;
            item.view.transform(top, left, width, height);
        });

        this.renderer.resize(this.width, this.height);
    }
}

const getError = (meta: string, message: string) => new Error(`[MULTI-SHAPE-VIEWER] ${meta} - ${message}`);

export default MultiShapeViewer;
