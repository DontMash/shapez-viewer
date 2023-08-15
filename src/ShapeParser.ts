import { Mesh } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import BASE_DATA from './assets/models/shapes/base.gltf';
import CIRCLE_QUARTER_DATA from './assets/models/shapes/circle-quarter.gltf';
import RECT_QUARTER_DATA from './assets/models/shapes/rect-quarter.gltf';
import WIND_QUARTER_DATA from './assets/models/shapes/wind-quarter.gltf';
import STAR_QUARTER_DATA from './assets/models/shapes/star-quarter.gltf';
import PIN_QUARTER_DATA from './assets/models/shapes/pin-quarter.gltf';
import CRYSTAL_QUARTER_DATA from './assets/models/shapes/crystal-quarter.gltf';

export type ShapeIdentifier = string;
type ShapeType = 'C' | 'R' | 'W' | 'S' | 'P' | 'c';
export type ShapeTypeIdentifier = ShapeType | '-';
type ShapeColor = 'r' | 'g' | 'b' | 'y' | 'p' | 'c' | 'w';
export type ShapeColorIdentifier = ShapeColor | 'u' | '-';
type ShapeQuarterData = {
    type: ShapeTypeIdentifier;
    color: ShapeColorIdentifier;
};
type ShapeLayerData = {
    layerIdentifier: ShapeIdentifier;
    quarters: Array<ShapeQuarterData>;
};
export type ShapeData = {
    identifier: ShapeIdentifier;
    layers: Array<ShapeLayerData>;
};
export type ShapeQuarter = Mesh;
export type ShapeQuarterMap = Record<ShapeTypeIdentifier, ShapeQuarter | undefined>;
export type ShapeLayerIndex = 0 | 1 | 2 | 3;
export type ShapeQuarterIndex = 0 | 1 | 2 | 3;

const SHAPE_LAYER_IDENTIFIER_SEPERATOR = ':';
const SHAPE_QUARTER_REGEX = /(..?)/g;
const SHAPE_QUARTER_PARAMETERS_REGEX = /(.?)/g;
const SHAPE_IDENTIFIER_REGEX = /^([CRWSPc-][rgbypcwu-]){1,4}(:([CRWSPc-][rgbypcwu-]){1,4}){0,3}$/;

export const isShapeIdentifier = (identifier: ShapeIdentifier): boolean => !!identifier.match(SHAPE_IDENTIFIER_REGEX);
export const getShapeData = (identifier: ShapeIdentifier): ShapeData => {
    if (!isShapeIdentifier(identifier)) {
        throw getError('getShapeData', `Invalid shape identifier ${identifier}`);
    }

    const layerIdentifiers: Array<ShapeIdentifier> = identifier.split(SHAPE_LAYER_IDENTIFIER_SEPERATOR);
    const layers = layerIdentifiers.map<ShapeLayerData>(layerIdentifier => {
        const quarterIdentifiers = layerIdentifier.match(SHAPE_QUARTER_REGEX);
        const quarters = quarterIdentifiers?.map<ShapeQuarterData>(quarterIdentifier => {
            const quarterShapeParameters = quarterIdentifier.match(SHAPE_QUARTER_PARAMETERS_REGEX);
            const quarterData: ShapeQuarterData = {
                type: quarterShapeParameters ? quarterShapeParameters[0] as ShapeTypeIdentifier : '-',
                color: quarterShapeParameters ? quarterShapeParameters[1] as ShapeColorIdentifier : '-',
            };
            return quarterData;
        }) ?? [];
        const layerData: ShapeLayerData = {
            layerIdentifier,
            quarters,
        };
        return layerData;
    });
    return { identifier, layers };
};

let shapeModels: Array<Mesh> | undefined;
export const getShapeModels = (): Promise<Array<Mesh>> =>
    new Promise<Array<Mesh>>((resolve, reject) => {
        if (shapeModels) {
            return resolve(shapeModels);
        }

        const loader = new GLTFLoader();
        Promise.all([
            loader.loadAsync(BASE_DATA),
            loader.loadAsync(CIRCLE_QUARTER_DATA),
            loader.loadAsync(RECT_QUARTER_DATA),
            loader.loadAsync(WIND_QUARTER_DATA),
            loader.loadAsync(STAR_QUARTER_DATA),
            loader.loadAsync(PIN_QUARTER_DATA),
            loader.loadAsync(CRYSTAL_QUARTER_DATA),
        ])
            .then(values => {
                shapeModels = values.map((value) => value.scene.children[0] as Mesh);
                return resolve(shapeModels);
            })
            .catch(reason => reject(getError('getModels', reason.toString())));
    });

export const getShapeQuarters = (): Promise<ShapeQuarterMap> => new Promise<ShapeQuarterMap>((resolve, reject) => {
    getShapeModels().then(models => resolve({
        C: models[1],
        R: models[2],
        W: models[3],
        S: models[4],
        P: models[5],
        c: models[6],
        '-': undefined
    })).catch(reject);
});

const getError = (meta: string, message: string) => new Error(`[SHAPE-PARSER] ${meta} - ${message}`);
