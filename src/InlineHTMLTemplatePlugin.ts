import { Compiler, compilation } from 'webpack';
import { ConcatSource, ReplaceSource, Source } from 'webpack-sources';
import * as HTMLWebpackPlugin from 'html-webpack-plugin';

import Compilation = compilation.Compilation;

interface HTMLWebpackPluginData {
  html: string;
  outputName: string;
  assets: {
    publicPath: string;
    css: string[];
  };
}

const replacementSearch = new RegExp('/* ?InlineHTML: ?(.*) */', 'g');

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
): ConcatSource | null {
  const [fullMatch, htmlName] = match;
  const { index = 0 }: { index?: number } = match;
  const matchesHtml = filename === htmlName;
  if (!matchesHtml) return null;

  const emptiedOriginal = new ReplaceSource(originalSource);
  emptiedOriginal.replace(index, index + fullMatch.length - 1, '');
  const emptiedSource = emptiedOriginal.source();
  let finalHtml = html.replace(/(\r\n|\n|\r)/gm, '');
  finalHtml = JSON.stringify(finalHtml);
  finalHtml = `"${finalHtml}"`;

  const firstPart = emptiedSource.substring(0, index);
  const lastPart = emptiedSource.substring(index);
  const replacement = new ConcatSource(firstPart, finalHtml, lastPart);
  return replacement;
}

function v3Plugin(comp: Compilation): void {
  // @ts-ignore Error:(130, 27) TS2339: Property 'htmlWebpackPluginBeforeHtmlProcessing' does not exist on type 'CompilationHooks'.
  comp.hooks.htmlWebpackPluginAfterHtmlProcessing.tap(
    `InlineHTMLTemplatePlugin_after_html_processing`,
    (data: HTMLWebpackPluginData) => {
      for (const [assetName, asset] of Object.entries(comp.assets)) {
        debugger;
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

type StatementDeclaration = {
  init: {
    value?: string;
  };
};

export default class InlineHTMLTemplatePlugin {
  apply(compiler: Compiler): void {
    compiler.hooks.compilation.tap(
      `InlineHTMLTemplatePlugin_compilation`,
      (comp: Compilation) => {
        const isHtmlWebpackPluginV4 = 'getHooks' in HTMLWebpackPlugin;
        const handler = (
          parser: compilation.normalModuleFactory.Parser
        ): void => {
          debugger;
          parser.hooks.statement.tap('InlineHTMLTemplatePlugin', statement => {
            if (statement.type != 'VariableDeclaration') return;

            const targets = statement.declarations.filter(
              (dec: StatementDeclaration) =>
                replacementSearch.test(dec.init?.value || '')
            );
            if (!targets.length) return;
            console.log(statement);
            debugger;
          });
        };

        if (isHtmlWebpackPluginV4) {
          const hooks = (HTMLWebpackPlugin as any).getHooks(comp);
          hooks.beforeEmit.tap(
            `InlineHTMLTemplatePlugin_beforeEmit`,
            ({ html, outputName }: { html: string; outputName: string }) => {
              debugger;
            }
          );
          //          const hooks = (HTMLWebpackPlugin as any).getHooks(comp);
          //          hooks.beforeEmit.tap(
          //            `InlineHTMLTemplatePlugin_beforeEmit`,
          //            ({ html, outputName }: { html: string; outputName: string }) => {
          //
          //              for (const [assetName, asset] of Object.entries(comp.assets)) {
          //                const replacementMatches = getMatches(asset);
          //
          //                for (const match of replacementMatches) {
          //                  const replacement = getReplacement(
          //                    match,
          //                    outputName,
          //                    html,
          //                    asset as Source
          //                  );
          //                  if (replacement) {
          //                    // @ts-ignore Error:(130, 27) TS2339: Property 'updateAsset' does not exist on type 'Compilation'.
          //                    comp.updateAsset(assetName, replacement);
          //                  }
          //                }
          //              }
          //            }
          //          );
        } else {
          v3Plugin(comp);
        }
      }
    );
  }
}
