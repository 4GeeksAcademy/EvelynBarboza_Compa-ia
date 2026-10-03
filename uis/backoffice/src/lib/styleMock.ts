const styles = new Proxy<Record<string, string>>({}, {
  get: (_target, key) => String(key),
});

export default styles;