# inline-html-template-plugin

[![Build Status](https://travis-ci.com/WTW-IM/inline-html-template-plugin.svg?branch=master)](https://travis-ci.com/github/WTW-IM/inline-html-template-plugin)
[![npm version](https://badge.fury.io/js/inline-html-template-plugin.svg)](https://badge.fury.io/js/inline-html-template-plugin)

## Installation

To install, simply run:

```bash
npm install --save inline-html-template-plugin
```

## The Problem

Sometimes, you need to inject javascript into an HTML file. Webpack handles this beautifully using HtmlWebpackPlugin. HtmlWebpackPlugin can also do a number of other dynamic things to generate an HTML file that's complete and ready for production.

In some cases, particularly with Web Components, you might need to inject HTML into your javascript. In the case of Web Components, your CSS will need to be inlined, and you'll want the CSS to be dynamically generated based on all the CSS imported throughout your app.

## The Solution

The InlineHTMLTemplatePlugin allows you to inline your finalized HTML as a template into any Javascript file. In Web Components, this means that you can use the completed HTML as a template, and your entire Web Component will be packaged into a single javascript file.

## Usage

A case for Web Components, as described above, might look like the following:

### webpack.config.js

```javascript
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HTMLInlineCSSWebpackPlugin = require('html-inline-css-webpack-plugin')
  .default;
const InlineHTMLTemplatePlugin = require('inline-html-template-plugin').default;

module.exports = {
  mode: 'development',
  entry: {
    component: __dirname + '/src/component.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              '@babel/plugin-proposal-object-rest-spread',
              '@babel/plugin-transform-runtime',
              '@babel/plugin-proposal-class-properties'
            ]
          }
        }
      },
      {
        test: /\.css$/i,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              sourceMap: false
            }
          },
          {
            loader: 'css-loader',
            options: {
              modules: true
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/component-template.html',
      filename: 'component-template.html',
      inject: false
    }),
    new MiniCssExtractPlugin(),
    new HTMLInlineCSSWebpackPlugin({
      replace: {
        target: '<!-- inline css -->',
        removeTarget: true
      }
    }),
    new InlineHTMLTemplatePlugin()
  ]
};
```

The key portion is this:

```javascript
plugins: [
  // load the template; give it a filename
  new HtmlWebpackPlugin({
    template: 'src/component-template.html',
    filename: 'component-template.html',
    // to avoid a circular reference, do not inject javascript
    inject: false
  }),
  // extract the css into a file
  new MiniCssExtractPlugin(),
  // inline that CSS into your HTML
  new HTMLInlineCSSWebpackPlugin({
    replace: {
      target: '<!-- inline css -->',
      removeTarget: true
    }
  }),
  // inject the finalized HTML as a string into your javascript
  new InlineHTMLTemplatePlugin()
];
```

### component-template.html

Your html might look like this:

```html
<div id="app-container">
  <!-- inline css -->
  <div id="mount"></div>
</div>
```

### component.js

Your component javascript might look something like this, where `myApp` is a javascript solution for initializing an application on a DOM node.

```javascript
import myApp from './myApp';
const loadedTemplate = '/* InlineHTML: component-template.html */';

class WebpackComponent extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ open: true });
    this.shadowRoot.innerHTML = loadedTemplate;
    myApp.initialize(this.shadowRoot.querySelector('#mount'));
  }
}
customElements.define('webpack-component', WebpackComponent);
```

In this javascript, the InlineHtmlTemplatePlugin looks for `"/* InlineHTML: component-template.html */"`, parses the filename from this string, and replaces the string with your finalized HTML Template.

## Contributing

This package uses `semantic-release`. Changes will be compiled into a changelog and the package versioned, tagged and published automatically.
Please ensure your commit messages adhere to the following structure:

```
<type>: <subject>
<BLANK LINE>
<body>
```

Only the header is mandatory. The supported types are based off of the [ESLint Convention](https://github.com/conventional-changelog/conventional-changelog/tree/35e279d40603b0969c6d622514f5c0984c5bf309/packages/conventional-changelog-eslint).
