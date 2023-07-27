import {
    Camera,
    ColorManagement,
    Scene,
    WebGLRenderer
} from 'three';
import { ShapeData } from './ShapeParser';

type ShapeViewElement = {
    scene: Scene,
    camera: Camera,
    data: ShapeData,
    top: number,
    left: number,
    width: number,
    height: number,
};

class MultiShapeRenderer {
    private renderer: WebGLRenderer;

    constructor(private canvas: HTMLCanvasElement, private width: number, private height: number, private pixelRatio: number = 1) {
        this.renderer = this.createRenderer(this.canvas, this.width, this.height, this.pixelRatio);
    }

    private createRenderer(canvas: HTMLCanvasElement, width: number, height: number, pixelRatio: number): WebGLRenderer {
        const renderer = new WebGLRenderer({
            alpha: true,
            antialias: true,
            canvas,
        });
        ColorManagement.enabled = true;
        renderer.useLegacyLights = false;
        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(width, height);
        renderer.setScissorTest(true);
        return renderer;
    }

    update(elements: Array<ShapeViewElement>) {
        elements.forEach(element => {
            const width = element.width
            const height = element.height;
            const left = element.left;
            const bottom = this.height - height - element.top;

            this.renderer.setViewport(left, bottom, width, height);
            this.renderer.setScissor(left, bottom, width, height);
            this.renderer.render(element.scene, element.camera);
        });
    }

    resize(width: number, height: number, pixelRatio: number = 1) {
        this.width = width;
        this.height = height;
        this.pixelRatio = pixelRatio;

        this.onResize();
    }

    private onResize() {
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(this.pixelRatio);
    }
}

export default MultiShapeRenderer;
