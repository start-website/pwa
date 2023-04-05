const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const translateConfig = require('./translate-config')

const createConfig = (lang = '', dev = false) => {
    translateConfigCopy = {}
    Object.assign(translateConfigCopy, translateConfig)

    if (lang !== 'en') {
        translateConfigCopy.importFilePath = translateConfigCopy.importFilePath.replace('{locale}', lang)
    } else {
        translateConfigCopy.excludedFilePaths = ["**"]
    }
   
    return {
        entry: {
            app: './src/index.js',
            'pwa-sw-register': { import: './src/js/pwa-sw-register.js', filename: lang + '/' + 'js/[name].js' },
        },
        name: dev ? 'configDev' : '',
        mode: 'production',
        output: {
            filename: lang + '/' + '[name].js',
            path: path.resolve(__dirname, 'dist'),
            assetModuleFilename: '[name].[ext]',
            clean: {
                dry: true, // Log the assets that should be removed instead of deleting them.
              },
        },
        plugins: [
            new HtmlWebpackPlugin({
                filename: lang + '/' + 'index.html',
                template: './src/index.html',
                inject: false,
                minify: false,
            }),
            new HtmlWebpackPlugin({
                filename: lang + '/' + 'offline.html',
                template: './src/offline.html',
                inject: false,
                minify: false,
            }),
            new MiniCssExtractPlugin({
                filename: lang + '/' + 'css/styles.css',
            }),
        ],
        devServer: {
            liveReload: true,
            port: 8433,
            open: true,
            devMiddleware: {
                index: true,
                serverSideRender: true,
                writeToDisk: true,
              },
            static: {
                directory: path.join(__dirname, 'dist') +  '/' + lang,
                watch: true,
            },
            watchFiles: [
                './src/*.html',
                './src/css/*.css',
                './src/js/*.js',
            ],
        },
        optimization: {
            minimize: false,
            usedExports: true,
        },
        module: {
            rules: [
                {
                    test: /\.html$/,
                    exclude: [
                        path.resolve(__dirname, './src/partial'),
                    ],
                    use:
                        [
                            {
                                loader: "html-loader",
                                options: {
                                    // Disables attributes processing
                                    sources: false,
                                },
                            },
                            { loader: "translation-loader", options: translateConfigCopy }
                        ]
                },
                {
                    test: /\.js$/i,
                    exclude: /(index\.js|\\pwa-sw\.js|\\pwa-sw-register\.js)/,
                    include: [
                        path.resolve(__dirname, './src/js'),
                        path.resolve(__dirname, './src/libs')
                    ],
                    type: 'asset/resource',
                    generator: {
                        filename: lang + '/' + 'js/[base]'
                    }
                },
                {
                    test: path.resolve(__dirname, 'src/pwa-sw.js'),
                    type: 'asset/resource',
                    generator: {
                        filename: lang + '/' + '[base]'
                    }
                },
                {
                    test: /\.css$/i,
                    exclude: /node_modules/,
                    include: [
                        path.resolve(__dirname, './src/css'),
                    ],
                    sideEffects: true,
                    use: [
                        {
                            loader: MiniCssExtractPlugin.loader
                        },
                        {
                            loader: 'css-loader',
                        },
                        {
                            loader: 'postcss-loader',
                        }
                    ],
                },
                {
                    test: path.resolve(__dirname, 'src/manifest.json'),
                    type: 'asset/resource',
                    generator: {
                        filename: lang + '/' + '[base]'
                    }
                },
                {
                    test: path.resolve(__dirname, 'src/images'),
                    type: 'asset/resource',
                    generator: {
                        filename: lang + '/images/manifest/' + '[base]'
                    }
                },
                {
                    test: /\.html$/i,
                    include: [
                        path.resolve(__dirname, './src/partial'),
                    ],
                    type: 'asset/resource',
                    generator: {
                        filename: lang + '/' + 'partial/[base]'
                    }
                }
            ],
        },
        experiments: {
            topLevelAwait: true,
        },
        performance: {
            hints: false,
            maxEntrypointSize: 512000,
            maxAssetSize: 512000
        }
    }
}

module.exports = [createConfig('en', true), createConfig('ru')];