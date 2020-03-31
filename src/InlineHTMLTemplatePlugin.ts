import { Compiler, compilation } from 'webpack';
import { ReplaceSource, Source } from 'webpack-sources';

require('html-webpack-plugin');
import Compilation = compilation.Compilation;

interface HTMLWebpackPluginData {
  html: string;
  outputName: string;
  assets: {
    publicPath: string;
    css: string[];
  };
}

const replacementSearch = /\\?("|')\/\* ?InlineHTML: ?(.*) \*\/\\?("|')/;

// asset is explicitly any as part of the Compilation type.
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
function getMatches(asset: any): RegExpMatchArray[] {
  const sourceText: string = asset.source();
  const replacementMatches = sourceText.matchAll(replacementSearch) || [];
  return [...replacementMatches];
}

function getReplacement(
  match: RegExpMatchArray,
  filename: string,
  html: string,
  originalSource: Source
): ReplaceSource | null {
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  const [fullMatch, firstQuote, htmlName] = match;
  const { index = 0 }: { index?: number } = match;
  const matchesHtml = filename === htmlName;
  if (!matchesHtml) return null;

  // @ts-ignore Error:(130, 27) TS2571: Object has type unknown.
  const replacement = new ReplaceSource(originalSource);
  let finalHtml = html.replace(/(\r\n|\n|\r)/gm, '');
  finalHtml = finalHtml.replace(/"/g, '\\\\\\"');
  finalHtml = `\\"${finalHtml}\\"`;
  replacement.replace(index, index + fullMatch.length - 1, finalHtml);
  return replacement;
}

export default class InlineHTMLTemplatePlugin {
  apply(compiler: Compiler): void {
    compiler.hooks.compilation.tap(
      `InlineHTMLTemplatePlugin_compilation`,
      (comp: Compilation) => {
        // @ts-ignore Error:(130, 27) TS2339: Property 'htmlWebpackPluginBeforeHtmlProcessing' does not exist on type 'CompilationHooks'.
        comp.hooks.htmlWebpackPluginAfterHtmlProcessing.tap(
          `InlineHTMLTemplatePlugin_after_html_processing`,
          (data: HTMLWebpackPluginData) => {
            for (const [assetName, asset] of Object.entries(comp.assets)) {
              const replacementMatches = getMatches(asset);

              for (const match of replacementMatches) {
                const replacement = getReplacement(
                  match,
                  data.outputName,
                  data.html,
                  asset as Source
                );
                if (replacement) {
                  // @ts-ignore Error:(130, 27) TS2339: Property 'updateAsset' does not exist on type 'Compilation'.
                  comp.updateAsset(assetName, replacement);
                }
              }
            }
          }
        );
      }
    );
  }
}
