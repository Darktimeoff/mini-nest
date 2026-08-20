export function joinRoutePath(...segments: string[]): string {
  const trimmed = segments
    .map(segment => segment.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)

  return `/${trimmed.join('/')}`
}
