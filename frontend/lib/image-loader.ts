import type { ImageLoaderProps } from 'next/image'

export default function myLoader({ src, width, quality }: ImageLoaderProps) {
  return src
}
