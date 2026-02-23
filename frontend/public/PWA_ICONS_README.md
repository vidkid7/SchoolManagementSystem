# PWA Icons Setup

## Required Icons

The PWA requires the following icon files in the `public` folder:

1. **pwa-192x192.png** - 192x192 pixels
2. **pwa-512x512.png** - 512x512 pixels
3. **apple-touch-icon.png** - 180x180 pixels (for iOS)
4. **favicon.ico** - 32x32 pixels

## How to Generate Icons

### Option 1: Using Online Tools
1. Visit https://realfavicongenerator.net/
2. Upload your school logo (minimum 512x512 pixels)
3. Configure settings for different platforms
4. Download and extract icons to this folder

### Option 2: Using ImageMagick (Command Line)
```bash
# From a 512x512 source image
convert logo-512.png -resize 192x192 pwa-192x192.png
convert logo-512.png -resize 512x512 pwa-512x512.png
convert logo-512.png -resize 180x180 apple-touch-icon.png
convert logo-512.png -resize 32x32 favicon.ico
```

### Option 3: Using Photoshop/GIMP
1. Open your school logo
2. Resize to each required dimension
3. Export as PNG (or ICO for favicon)
4. Save with the exact filenames listed above

## Icon Design Guidelines

- **Background**: Use solid color or transparent background
- **Logo**: Center the school logo/emblem
- **Colors**: Use school brand colors (primary: #1976d2, secondary: #dc004e)
- **Text**: Avoid small text (won't be readable at small sizes)
- **Padding**: Leave 10-15% padding around the logo
- **Format**: PNG with transparency for best results

## Temporary Placeholder

Until custom icons are created, you can use a simple colored square:
- Background: School primary color (#1976d2)
- Text: "SMS" in white, centered
- Font: Bold, sans-serif

## Testing

After adding icons:
1. Run `npm run build`
2. Run `npm run preview`
3. Open DevTools > Application > Manifest
4. Verify all icons are loaded correctly
5. Test "Add to Home Screen" on mobile device
