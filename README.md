# Portfolio

Hello! This is my portfolio website, where I showcase a few fun coding projects—graphics, simulations, games, and hardware-related work.

## Projects

- **Charge Simulator** — Interactive electric field and charge simulator with real-time visualization.
- **Snake** — Neural network learns to play Snake using evolutionary algorithms.
- **Snake 2** — Improved Snake AI with real-time learning and multiple agents.
- **Raytracing** — CPU-based raytracer with reflections and soft shadows.
- **WebGL Raytracing** — GPU-accelerated raytracer using WebGL shaders.
- **Tethered Cubes** — 3D physics simulation of interconnected cubes with spring forces.
- **Thread Art** — Algorithm to convert images into thread art patterns.
- **Planet Generator** — Procedural planet generation with customizable parameters.
- **CNC Router** — Custom CNC router control software with G-code support.
- **EasyGL** — Simplified WebGL wrapper for 3D graphics programming.

## Build and deploy

This app was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### `npm run build`

Creates an optimized production build in the `build/` folder: minified bundles, hashed filenames, and assets ready to host. Use this to verify the site compiles before deploying or to inspect the output locally.

### `npm run deploy`

Publishes the site to GitHub Pages. The `predeploy` script runs `npm run build` first, then the deploy step writes a `CNAME` file for the custom domain and uses [gh-pages](https://www.npmjs.com/package/gh-pages) to push the contents of `build/` to the `gh-pages` branch. After it finishes, GitHub Pages serves that branch (configure the repo’s Pages settings to use the `gh-pages` branch if needed).
