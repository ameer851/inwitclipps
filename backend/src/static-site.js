/**
 * static-site.js
 * Builds and serves the generated InwitClipps marketing site.
 */

import express from 'express';
import { ensureSiteBuilt } from '../../frontend/site/generator.mjs';

export function registerMarketingSite(app) {
  const siteDir = ensureSiteBuilt();

  app.use(
    express.static(siteDir, {
      extensions: ['html'],
      index: 'index.html',
      dotfiles: 'ignore',
      redirect: true,
    }),
  );
}
