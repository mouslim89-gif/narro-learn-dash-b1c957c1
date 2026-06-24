export const join = (...args: string[]) => {
  return args.join('/').replace(/\/+/g, '/');
};

export default {
  join
};
