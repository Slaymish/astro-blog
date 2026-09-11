import { createImageUrlBuilder, type ImageUrlBuilder } from '@sanity/image-url';
import type { SanityImage } from './types';

export interface SrcSet {
  src: string;
  srcset: string;
  width: number;
  height: number;
}

/**
 * A Sanity asset URL carries the project and dataset it came from
 * (https://cdn.sanity.io/images/<project>/<dataset>/<file>), so the builder is
 * derived from the image rather than from the client. That keeps this module
 * free of `astro:env/server`, which the unit tests cannot resolve, while still
 * going through @sanity/image-url so hotspot and crop are honoured.
 */
const builders = new Map<string, ImageUrlBuilder>();

function builderFor(assetUrl: string): ImageUrlBuilder {
  const match = /\/images\/([^/]+)\/([^/]+)\//.exec(assetUrl);
  if (!match) throw new Error(`Not a Sanity image URL: ${assetUrl}`);
  const [, projectId, dataset] = match as unknown as [string, string, string];
  const key = `${projectId}/${dataset}`;
  let builder = builders.get(key);
  if (!builder) {
    builder = createImageUrlBuilder({ projectId, dataset });
    builders.set(key, builder);
  }
  return builder;
}

/**
 * Responsive candidates for a Sanity image. `auto('format')` lets the CDN send
 * AVIF or WebP where the browser accepts it, and the intrinsic dimensions are
 * returned so the <img> can reserve the right box and avoid a layout shift.
 */
export function sanitySrcSet(
  image: SanityImage,
  widths: number[],
  options: { aspect?: number } = {},
): SrcSet {
  const { aspect } = options;
  const { width: intrinsicWidth, height: intrinsicHeight, url: assetUrl } = image.asset;
  const builder = builderFor(assetUrl);

  // Never upscale: a 680px asset asked for at 1920 would just be blurry bytes.
  const usable = widths.filter((width) => width <= intrinsicWidth).sort((a, b) => a - b);
  const candidates = usable.length > 0 ? usable : [Math.min(widths[0] ?? intrinsicWidth, intrinsicWidth)];

  const url = (width: number): string => {
    let chain = builder.image(image).width(width).auto('format').quality(80);
    if (aspect) chain = chain.height(Math.round(width / aspect)).fit('crop');
    return chain.url();
  };

  const largest = candidates[candidates.length - 1]!;

  return {
    src: url(largest),
    srcset: candidates.map((width) => `${url(width)} ${width}w`).join(', '),
    width: largest,
    height: aspect ? Math.round(largest / aspect) : Math.round((largest / intrinsicWidth) * intrinsicHeight),
  };
}
