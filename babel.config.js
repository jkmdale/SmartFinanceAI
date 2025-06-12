module.exports = function (api) {
  api.cache(true);

  const presets = [
    [
      '@babel/preset-env',
      {
        // Browser targets
        targets: {
          browsers: [
            '> 1%',
            'last 2 versions',
            'not dead',
            'not ie 11'
          ]
        },
        
        // Module handling
        modules: false, // Let bundler handle modules
        
        // Use built-ins for polyfills
        useBuiltIns: 'usage',
        corejs: {
          version: 3,
          proposals: true
        },
        
        // Debug mode for development
        debug: process.env.NODE_ENV === 'development',
        
        // Optimize for modern browsers in production
        bugfixes: true,
        
        // Shipping proposals
        shippedProposals: true,
        
        // Include polyfills for specific features
        include: [
          // Web APIs we use
          'web.dom-collections.iterator',
          'web.url',
          'web.url-search-params',
          
          // ES features we rely on
          'es.promise',
          'es.array.from',
          'es.array.includes',
          'es.array.find',
          'es.array.find-index',
          'es.object.assign',
          'es.object.values',
          'es.object.entries',
          'es.string.includes',
          'es.string.starts-with',
          'es.string.ends-with',
          'es.string.pad-start',
          'es.string.pad-end',
          'es.map',
          'es.set',
          'es.weak-map',
          'es.weak-set'
        ]
      }
    ]
  ];

  const plugins = [
    // Syntax plugins
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-syntax-import-meta',
    
    // Transform plugins
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-private-methods',
    '@babel/plugin-proposal-private-property-in-object',
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    
    // Object rest spread
    '@babel/plugin-proposal-object-rest-spread',
    
    // Async/await
    '@babel/plugin-transform-async-to-generator',
    
    // Runtime helpers
    [
      '@babel/plugin-transform-runtime',
      {
        corejs: false,
        helpers: true,
        regenerator: true,
        useESModules: true,
        absoluteRuntime: false,
        version: '^7.22.0'
      }
    ],
    
    // Environment-specific plugins
    ...(process.env.NODE_ENV === 'development' ? [
      // Development plugins
    ] : []),
    
    ...(process.env.NODE_ENV === 'production' ? [
      // Production optimizations
      '@babel/plugin-transform-react-constant-elements',
      '@babel/plugin-transform-react-inline-elements',
      
      // Remove development code
      ['babel-plugin-transform-remove-console', {
        exclude: ['error', 'warn', 'info']
      }]
    ] : []),
    
    // PWA and Service Worker support
    ...(process.env.BUILD_PWA === 'true' ? [
      ['babel-plugin-transform-imports', {
        'workbox-window': {
          transform: 'workbox-window/${member}',
          preventFullImport: true
        }
      }]
    ] : [])
  ];

  // Environment-specific configurations
  const env = {
    development: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              browsers: ['last 1 chrome version', 'last 1 firefox version']
            },
            modules: false,
            debug: true
          }
        ]
      ],
      plugins: [
        // Hot reloading support
        'react-refresh/babel'
      ]
    },
    
    production: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              browsers: [
                '> 0.5%',
                'last 2 versions',
                'not dead',
                'not ie 11',
                'not chrome < 60',
                'not firefox < 60',
                'not safari < 12',
                'not ios < 12'
              ]
            },
            modules: false,
            useBuiltIns: 'usage',
            corejs: 3
          }
        ]
      ],
      plugins: [
        // Production optimizations
        '@babel/plugin-transform-react-constant-elements',
        '@babel/plugin-transform-react-inline-elements',
        
        // Remove PropTypes in production
        'babel-plugin-transform-react-remove-prop-types',
        
        // Remove console statements except errors
        ['transform-remove-console', {
          exclude: ['error', 'warn']
        }],
        
        // Dead code elimination
        'babel-plugin-minify-dead-code-elimination'
      ]
    },
    
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current'
            },
            modules: 'commonjs'
          }
        ]
      ],
      plugins: [
        // Test environment plugins
        'babel-plugin-dynamic-import-node'
      ]
    }
  };

  return {
    presets,
    plugins,
    env,
    
    // Parser options
    parserOpts: {
      strictMode: true,
      allowImportExportEverywhere: true,
      allowReturnOutsideFunction: false
    },
    
    // Generator options
    generatorOpts: {
      minified: process.env.NODE_ENV === 'production',
      compact: process.env.NODE_ENV === 'production',
      comments: process.env.NODE_ENV !== 'production'
    },
    
    // Source maps
    sourceMaps: process.env.NODE_ENV !== 'production',
    inputSourceMap: true,
    
    // Ignore files
    ignore: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '**/*.min.js'
    ],
    
    // Only process certain files
    only: [
      'src/**/*.js',
      'src/**/*.mjs',
      'public/**/*.js'
    ],
    
    // Overrides for specific file patterns
    overrides: [
      {
        test: /\.worker\.js$/,
        presets: [
          [
            '@babel/preset-env',
            {
              targets: {
                browsers: ['chrome >= 60', 'firefox >= 60']
              },
              modules: false
            }
          ]
        ]
      },
      
      {
        test: /\/sw\.js$/,
        presets: [
          [
            '@babel/preset-env',
            {
              targets: {
                browsers: ['chrome >= 60', 'firefox >= 60']
              },
              modules: false
            }
          ]
        ],
        plugins: [
          ['babel-plugin-transform-imports', {
            'workbox-sw': {
              transform: 'workbox-sw/${member}',
              preventFullImport: true
            }
          }]
        ]
      },
      
      {
        test: /\.config\.js$/,
        presets: [
          [
            '@babel/preset-env',
            {
              targets: {
                node: 'current'
              },
              modules: 'commonjs'
            }
          ]
        ]
      }
    ],
    
    // Assumptions for optimizations
    assumptions: {
      setPublicClassFields: true,
      privateFieldsAsProperties: true,
      constantSuper: true,
      noDocumentAll: true,
      noNewArrows: true,
      objectRestNoSymbols: true,
      pureGetters: true,
      setSpreadProperties: true,
      skipForOfIteratorClosing: true,
      superIsCallableConstructor: true
    }
  };
};