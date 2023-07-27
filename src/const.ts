import { Material, MeshToonMaterial, Vector3 } from 'three';
import { ShapeColorIdentifier, ShapeIdentifier } from './ShapeParser';

export const SHAPE: ShapeIdentifier = 'CwRwCwCw:P-P-P-P-:P-P-P-P-:CcCcCcCc';

export const SHAPE_BASE_OFFSET = 0.05;
export const SHAPE_MAX_LAYERS = 4;
export const SHAPE_LAYER_HEIGHT = 0.1;
export const SHAPE_QUARTER_EXPAND_OFFSET = new Vector3(0.3, 0, 0.3);
export const SHAPE_LAYER_SCALE_FACTOR = 0.24;

export const SHAPE_COLOR_BASE = 0x555555;
export const SHAPE_COLOR_NONE = 0x777777;
export const SHAPE_COLOR_PIN = 0x444450;
export const SHAPE_COLOR_RED = 0xee3333;
export const SHAPE_COLOR_GREEN = 0x00ee00;
export const SHAPE_COLOR_BLUE = 0x0000ee;
export const SHAPE_COLOR_YELLOW = 0xeeee00;
export const SHAPE_COLOR_PURPLE = 0xcc00cc;
export const SHAPE_COLOR_CYAN = 0x00eeee;
export const SHAPE_COLOR_WHITE = 0xfafafa;

export const SHAPE_COLOR_BASE_MATERIAL = new MeshToonMaterial({ color: SHAPE_COLOR_BASE });
export const SHAPE_COLOR_NONE_MATERIAL = new MeshToonMaterial({ color: SHAPE_COLOR_NONE, vertexColors: true });
export const SHAPE_COLOR_PIN_MATERIAL = new MeshToonMaterial({ color: SHAPE_COLOR_PIN, vertexColors: true });
export const SHAPE_COLOR_RED_MATERIAL = new MeshToonMaterial({ color: SHAPE_COLOR_RED, vertexColors: true });
export const SHAPE_COLOR_GREEN_MATERIAL = new MeshToonMaterial({ color: SHAPE_COLOR_GREEN, vertexColors: true });
export const SHAPE_COLOR_BLUE_MATERIAL = new MeshToonMaterial({ color: SHAPE_COLOR_BLUE, vertexColors: true });
export const SHAPE_COLOR_YELLOW_MATERIAL = new MeshToonMaterial({ color: SHAPE_COLOR_YELLOW, vertexColors: true });
export const SHAPE_COLOR_PURPLE_MATERIAL = new MeshToonMaterial({ color: SHAPE_COLOR_PURPLE, vertexColors: true });
export const SHAPE_COLOR_CYAN_MATERIAL = new MeshToonMaterial({ color: SHAPE_COLOR_CYAN, vertexColors: true });
export const SHAPE_COLOR_WHITE_MATERIAL = new MeshToonMaterial({ color: SHAPE_COLOR_WHITE, vertexColors: true });

export const SHAPE_COLOR_MATERIALS: Record<ShapeColorIdentifier, Material> = {
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
