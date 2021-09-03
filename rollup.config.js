import { terser } from 'rollup-plugin-terser';

function generateConfig(format, minify) {
    const nameFormat = format === 'umd' ? '' : `.${format}`;
    const nameMinfy = minify && format === 'umd' ? '.min' : '';
    const plugins = [];
    if (minify) {
        plugins.push(terser());
    }
    return {
        input: 'index.js',
        output: {
            file: `dist/fson_db${nameFormat}${nameMinfy}.js`,
            name: 'FsonDB',
            format,
        },
        plugins,
    };
}
module.exports = [
    generateConfig('umd', true),
    generateConfig('umd', false),
    generateConfig('cjs', true),
    generateConfig('esm', true),
];