import { NativeImage, nativeImage } from 'electron';
import { injectable } from 'inversify';
import { join } from 'path';

@injectable()
export default class Assets {
    public getAssetPath(asset: string): string {
        return join(__dirname, 'assets', ...asset.split('/'));
    }

    public getNativeImage(imagePath: string, isTemplate: boolean = false): NativeImage {
        const path = this.getAssetPath(imagePath);
        const image = nativeImage.createFromPath(path);
        if (isTemplate) {
            image.setTemplateImage(true);
        }
        return image;
    }
}
