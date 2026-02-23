# Image Artifact Removal

Browser-based compression artifact and noise removal for images. Runs entirely in the browser. No images are uploaded or transmitted.

[Live site](https://sawawai.github.io/image-artifact-removal)

## How it works

Images are processed locally using ESRGAN-based denoising models. The selected model is downloaded once on first use and cached by the browser for subsequent sessions. Processing runs on the GPU via WebGPU where available, and falls back to CPU otherwise.

Two models are available:

- **Sharp** — uses 1x_PureVision. Processes at the original image resolution.
- **Natural** — uses 2x_PureVision. Processes at 2x resolution and downsamples the result to match the original. Slower.

A strength slider allows blending between the original and processed image after processing is complete. Results can be saved as PNG.

Accepted formats: JPEG, PNG, WebP, AVIF.

## Browser support

Requires a browser with WebGPU support for fast processing. CPU fallback is available but not recommended.

## Credits

**Models:** 1x_PureVision and 2x_PureVision by [limitlesslab](https://github.com/limitlesslab/AI-upscaling-models/releases/tag/PureVision). Licensed under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). Non-commercial use only.

**Runtime:** [ONNX Runtime Web](https://onnxruntime.ai/) by Microsoft. Licensed under MIT.

**Fonts:** Noto Sans JP by Google. Licensed under SIL Open Font License 1.1.
