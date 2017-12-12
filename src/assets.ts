import { NativeImage, nativeImage } from 'electron';
import { join } from 'path';

export default class Assets {
    public static getAssetPath(asset: string): string {
        return join(__dirname, 'assets', ...asset.split('/'));
    }

    public static getNativeImage(imagePath: string, isTemplate: boolean = false): NativeImage {
        const path = this.getAssetPath(imagePath);
        const image = nativeImage.createFromPath(path);
        if (isTemplate) {
            image.setTemplateImage(true);
        }
        return image;
    }
}
