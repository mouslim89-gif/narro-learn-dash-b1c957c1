export function slugifyPattern(pattern: string): string {
  return pattern
    .toLowerCase()
    .trim()
    .replace(/[^\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf0-9a-z]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
