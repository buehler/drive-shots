import { NativeImage, nativeImage } from 'electron';
import { injectable } from 'inversify';
import { join } from 'path';
import { Logger } from './utils/logger';

@injectable()
export class Assets {
  constructor(private readonly logger: Logger) {}

  public getAssetPath(asset: string): string {
    this.logger.debug(`Assets: Get asset: ${asset}`);
    return join(__dirname, 'assets', ...asset.split('/'));
  }

  public getNativeImage(
    imagePath: string,
    isTemplate: boolean = false,
  ): NativeImage {
    this.logger.debug(`Assets: Get native image: ${imagePath}`);
    const path = this.getAssetPath(imagePath);
    const image = nativeImage.createFromPath(path);
    if (isTemplate) {
      image.setTemplateImage(true);
    }
    return image;
  }
}
