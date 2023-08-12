import {
    ColorManagement,
    WebGLRenderer
} from 'three';
import ShapeView from './ShapeView';

class ShapeRenderer {
    private renderer: WebGLRenderer;
    private pixelRatio_: number | undefined;

    constructor(
        private canvas: HTMLCanvasElement,
        private width: number,
        private height: number,
    ) {
        this.renderer = this.createRenderer(this.canvas);
        this.onResize();
    }

    get pixelRatio(): number | undefined {
        return this.pixelRatio_;
    }
    set pixelRatio(value: number | undefined) {
        this.pixelRatio_ = value;
        this.onResize();
    }

    private createRenderer(canvas: HTMLCanvasElement): WebGLRenderer {
        const renderer = new WebGLRenderer({
            alpha: true,
            antialias: true,
            canvas,
        });
        ColorManagement.enabled = true;
        renderer.useLegacyLights = false;
        renderer.setScissorTest(true);
        return renderer;
    }

    update(views: Array<ShapeView>) {
        views.forEach(view => {
            const width = view.width;
            const height = view.height;
            const left = view.left;
            const bottom = this.height - view.top - view.height;

            this.renderer.setViewport(left, bottom, width, height);
            this.renderer.setScissor(left, bottom, width, height);
            this.renderer.render(view.scene, view.camera);
        });
    }

    resize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.onResize();
    }

    private onResize() {
        this.renderer.setSize(this.width, this.height);
        if (this.pixelRatio_)
            this.renderer.setPixelRatio(this.pixelRatio_);
    }
}

export default ShapeRenderer;
