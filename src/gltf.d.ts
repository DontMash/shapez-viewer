type GLTFData = `data:model/gltf+json;base64,${string}`

declare module "*.gltf" {
    const value: GLTFData;
    export default value;
}
