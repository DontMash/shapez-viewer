import { Mesh } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

import CIRCLE_QUARTER_DATA from './assets/models/gltf/shapes/circle-quarter.gltf';
import RECT_QUARTER_DATA from './assets/models/gltf/shapes/rect-quarter.gltf';
import WIND_QUARTER_DATA from './assets/models/gltf/shapes/wind-quarter.gltf';
import STAR_QUARTER_DATA from './assets/models/gltf/shapes/star-quarter.gltf';
import PIN_QUARTER_DATA from './assets/models/gltf/shapes/pin-quarter.gltf';

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

export const getShapeData = (identifier: ShapeIdentifier): ShapeData => {
    if (!identifier.match(SHAPE_IDENTIFIER_REGEX)) {
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

let models: Array<Mesh> | undefined;
const getModels = (): Promise<Array<Mesh>> =>
    new Promise<Array<Mesh>>((resolve, reject) => {
        if (models) {
            return resolve(models);
        }
        
        const loader = new GLTFLoader();
        Promise.all([
            loader.loadAsync(CIRCLE_QUARTER_DATA),
            loader.loadAsync(RECT_QUARTER_DATA),
            loader.loadAsync(WIND_QUARTER_DATA),
            loader.loadAsync(STAR_QUARTER_DATA),
            loader.loadAsync(PIN_QUARTER_DATA),
        ])
            .then(values => {
                models = values.map((value) => value.scene.children[0] as Mesh);
                return resolve(models);
            })
            .catch(reason => reject(getError('getModels', reason.toString())));
    });

export const getQuarters = (): Promise<ShapeQuarterMap> => new Promise<ShapeQuarterMap>((resolve, reject) => {
    getModels().then(models => resolve({
        C: models[0],
        R: models[1],
        W: models[2],
        S: models[3],
        P: models[4],
        c: models[0],
        '-': undefined
    })).catch(reject);
});

const getError = (meta: string, message: string) => new Error(`[SHAPE-PARSER] ${meta} - ${message}`);
