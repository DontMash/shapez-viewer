export type ShapeIdentifier = string;
type ShapeType = 'C' | 'R' | 'W' | 'S' | 'P';
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

const SHAPE_LAYER_IDENTIFIER_SEPERATOR = ':';
const SHAPE_QUARTER_REGEX = /(..?)/g;
const SHAPE_QUARTER_PARAMETERS_REGEX = /(.?)/g;
const SHAPE_IDENTIFIER_REGEX = /^([CRWSP-][rgbypcwu-]){4}(:([CRWSP-][rgbypcwu-]){4}){0,4}$/;

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

const getError = (meta: string, message: string) => new Error(`[SHAPE-PARSER] ${meta} - ${message}`);
