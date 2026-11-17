const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');
function loadSource(file, mocks = {}) {
  const filename = path.resolve(__dirname, '../', file);
  const compiled = babel.transformSync(fs.readFileSync(filename, 'utf8'), { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-react-jsx', '@babel/plugin-transform-modules-commonjs'], filename }).code;
  const module = { exports: {} };
  const customRequire = (name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name.startsWith('.')) return loadSource(path.relative(path.resolve(__dirname, '..'), path.resolve(path.dirname(filename), name + (path.extname(name) ? '' : '.js'))), mocks);
    return require(name);
  };
  vm.runInNewContext(compiled, { module, exports: module.exports, require: customRequire, console, setTimeout, clearTimeout, Intl, Date, URL }, { filename });
  return module.exports;
}
module.exports = { loadSource };
