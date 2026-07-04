import type { ImageLoaderProps } from 'next/image'

export default function myLoader({ src, width, quality }: ImageLoaderProps) {
  if (src.includes('?')) {
    return `${src}&width=${width}`;
  }
  return `${src}?width=${width}`;
}
