export const join = (...args: string[]) => {
  const result = args.join('/').replace(/\/+/g, '/');
  // Preserve https:// or http://
  return result.replace(/^(https?):\/+/, '$1://');
};

export const dirname = (path: string) => {
  const parts = path.split('/');
  parts.pop();
  return parts.join('/') || '.';
};

export const resolve = (...args: string[]) => {
  return join(...args);
};

export const basename = (path: string) => {
  return path.split('/').pop() || '';
};

export const extname = (path: string) => {
  const base = basename(path);
  const idx = base.lastIndexOf('.');
  return idx === -1 ? '' : base.slice(idx);
};

export default {
  join,
  dirname,
  resolve,
  basename,
  extname
};

