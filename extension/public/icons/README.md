# Extension Icons

Place your extension icons here:

- `icon16.png` - 16x16 pixels (toolbar icon)
- `icon48.png` - 48x48 pixels (extension management page)
- `icon128.png` - 128x128 pixels (Chrome Web Store)

## How to create icons

For MVP/testing, you can use any PNG images or create simple colored squares:

### Quick Method (using ImageMagick):
```bash
# Install ImageMagick first: brew install imagemagick

convert -size 16x16 xc:#4A90E2 icon16.png
convert -size 48x48 xc:#4A90E2 icon48.png
convert -size 128x128 xc:#4A90E2 icon128.png
```

### Manual Method:
1. Create images in any graphics tool (Figma, Photoshop, GIMP, etc.)
2. Use a brain/note/document icon theme
3. Use the primary color: #4A90E2 (blue)
4. Export as PNG at the required sizes

### Online Tools:
- https://www.favicon-generator.org/
- https://realfavicongenerator.net/
- https://www.canva.com/ (free design tool)

For production, consider hiring a designer or using professional icon sets.
