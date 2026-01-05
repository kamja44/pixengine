# 📊 PixEngine Benchmarks

Comprehensive performance analysis of PixEngine's image optimization capabilities across different formats, quality settings, and output sizes.

---

## 🎯 Test Methodology

### Test Images
- **Total Images**: 11 synthetic test images
- **Image Types**:
  - Solid colors (3) - Best case for compression
  - Gradients (2) - Banding test
  - Text overlays (2) - Sharp edges test
  - Noise pattern (1) - Worst case for compression
  - Checkerboard (1) - High-frequency details
  - UI mockup (1) - Realistic scenario
  - Mixed content (1) - Gradient + text

### Test Dimensions
- **Original Size**: 1920x1080 pixels
- **Test Configurations**:
  - Quality levels: 50, 70, 85, 95
  - Formats: WebP, AVIF, JPEG, PNG
  - Output sizes: 200px, 500px, 800px, 1200px

### Total Tests Performed
**132 tests** across all combinations

---

## 📈 Overall Statistics

| Metric | Value |
|--------|-------|
| Total tests performed | 132 |
| Unique images tested | 11 |
| **Average reduction** | **79.4%** |

---

## 🎨 Format Comparison

Performance comparison at **Quality 85, 800px width**.

| Format | Avg Reduction | Min | Max | Avg Output Size |
|--------|---------------|-----|-----|-----------------|
| **WebP** | **84.5%** | 58.3% | 94.1% | 20.5 KB |
| **AVIF** | **83.0%** | 51.2% | 97.4% | 47.2 KB |
| JPEG | 63.0% | -39.2% | 87.7% | 27.7 KB |
| PNG | 42.4% | -154.5% | 96.3% | 44.0 KB |

### Key Findings

✅ **WebP** delivers the best overall compression (84.5% average)
✅ **AVIF** excels at solid colors and gradients (up to 97.4%)
⚠️ **JPEG** struggles with patterns but handles noise well
⚠️ **PNG** only efficient for specific content (text, patterns)

### ⚠️ Important Notes

- Converting PNG → JPEG can **increase** file size (up to -154%)
- Converting JPEG → PNG is highly inefficient
- Format choice should match content type

---

## ⚙️ Quality Parameter Impact

WebP compression at **800px width** across different quality settings.

| Quality | Avg Reduction | Avg Output Size | Size vs Q85 |
|---------|---------------|-----------------|-------------|
| 50 | 88.8% | 12.2 KB | -40.5% |
| 70 | 87.7% | 15.0 KB | -26.6% |
| **85** | **84.5%** | **20.5 KB** | **0.0%** (baseline) |
| 95 | 73.5% | 30.6 KB | +49.5% |

### 🎯 Quality Sweet Spot: 70-85

#### Why Quality 70-85?

**Quality 50 → 70**: File size increases 23%, but quality improves significantly ✅
**Quality 70 → 85**: File size increases 37%, quality improves moderately ✅
**Quality 85 → 95**: File size increases 49%, quality improves minimally ❌

#### Calculation Example

```
Q85 → Q95: +49.5% file size for only 11% less compression
Q70 → Q85: +36.7% file size for 3.2% less compression (more efficient)
```

**Recommendation**:
- **Quality 70**: Best balance for most use cases
- **Quality 85**: Industry standard, safer choice
- **Quality 95**: Only for critical assets requiring highest fidelity

---

## 📐 Output Size Impact

WebP Quality 85 across different output widths.

| Width | Avg Reduction | Avg Output Size | Avg Dimensions |
|-------|---------------|-----------------|----------------|
| 200px | **96.1%** | 2.1 KB | 200x113 |
| 500px | 90.7% | 8.6 KB | 500x281 |
| 800px | 84.5% | 20.5 KB | 800x450 |
| 1200px | 74.7% | 48.5 KB | 1200x675 |

### Key Insight

**Thumbnails (200px) achieve the highest compression**: 96.1% reduction!

Smaller output sizes benefit from:
- Fewer pixels to encode
- Loss of fine details (intentional)
- Better compression ratios

---

## 🏆 Best Format by Image Type

| Image Type | Best Format | Reduction | Worst Format | Reduction |
|------------|-------------|-----------|--------------|-----------|
| Solid colors | AVIF | 97.4% | JPEG | 80.5% |
| Gradients | AVIF | 82-85% | PNG | -154% |
| Text overlays | PNG | 85% | JPEG | 53-61% |
| UI mockup | AVIF | 85.7% | JPEG | 68.6% |
| Mixed content | AVIF | 93.2% | PNG | 63.2% |
| Checkerboard | PNG | 95% | JPEG | -39.2% |
| Noise pattern | JPEG | 87.7% | AVIF | 64.2% |

### Format Selection Guidelines

```typescript
// Recommended policy logic based on content type

if (solidColor || gradient) {
  format = "avif";  // Best for smooth color transitions
}

if (text || sharpEdges || patterns) {
  format = "png";   // Preserves sharp edges
}

if (photo || naturalImage) {
  format = "webp";  // Best all-around performance
}

if (highNoise || grain) {
  format = "jpeg";  // Handles noise better than modern formats
}
```

---

## 💡 Key Insights

### 1. Best Overall Format
**WebP** achieves 84.5% average reduction across all image types.

### 2. Quality Sweet Spot
**Quality 70-85** offers the best balance between file size and visual quality.

- Quality 70: 87.7% reduction (aggressive but good)
- Quality 85: 84.5% reduction (recommended standard)

### 3. Thumbnail Optimization
**200px thumbnails achieve 96.1% reduction** - extreme optimization for small sizes.

### 4. Format-Specific Performance
- **WebP** performed better on **4/11 images** (36%)
- **AVIF** performed better on **7/11 images** (64%)

**Conclusion**: No single format is universally best. Content-aware format selection is crucial.

---

## 📋 Recommended Policies

### Conservative (High Quality)
```typescript
policy: () => ({
  variants: [
    { width: 200, format: "webp", quality: 85 },
    { width: 800, format: "webp", quality: 90 },
    { width: 1200, format: "avif", quality: 90 },
  ],
});
```

### Balanced (Recommended)
```typescript
policy: () => ({
  variants: [
    { width: 200, format: "webp", quality: 70 },
    { width: 800, format: "webp", quality: 85 },
    { width: 1200, format: "avif", quality: 85 },
  ],
});
```

### Aggressive (Maximum Compression)
```typescript
policy: () => ({
  variants: [
    { width: 200, format: "webp", quality: 50 },
    { width: 500, format: "webp", quality: 70 },
    { width: 800, format: "avif", quality: 70 },
  ],
});
```

### Content-Aware (Advanced)
```typescript
policy: (ctx) => {
  // Detect solid colors or simple gradients
  if (ctx.bytes < 100000 && ctx.format === "png") {
    return {
      variants: [{ width: 800, format: "avif", quality: 85 }],
    };
  }

  // Photos
  if (ctx.format === "jpeg") {
    return {
      variants: [
        { width: 200, format: "webp", quality: 70 },
        { width: 800, format: "webp", quality: 85 },
      ],
    };
  }

  // Text/UI (preserve sharpness)
  return {
    variants: [{ width: 800, format: "png", quality: 95 }],
  };
},
```

---

## ⚠️ Important Limitations

### Synthetic Test Images
These benchmarks use **programmatically-generated test images**, not real-world photos. Results may vary with:
- Complex photographic content
- Images with EXIF data
- Images with transparency
- Very large (>4000px) images
- Extremely small (<100px) images

### Quality Assessment
File size reduction percentages are reported, but **perceptual quality** should always be verified manually for production use.

> **Recommendation**: Always perform visual quality checks on a representative sample of your actual images before deploying to production.

---

## 📚 Related Documentation

- [Quality Parameter Guide](./QUALITY-GUIDE.md) _(coming soon)_
- [Policy Examples](./POLICY-EXAMPLES.md) _(coming soon)_
- [Format Comparison](./FORMAT-COMPARISON.md) _(coming soon)_

---

## 🔬 Reproducing These Tests

All benchmark scripts are available in the repository for full transparency and reproducibility.

```bash
# Clone the repository
git clone https://github.com/pixengine/pixengine.git
cd pixengine/examples/benchmarks

# Install dependencies
npm install

# Run the full benchmark suite
npm run all

# Or run steps individually:
npm run generate  # Generate test images
npm run bench     # Run benchmarks
npm run analyze   # Analyze results
```

For detailed instructions, see [examples/benchmarks/README.md](../../examples/benchmarks/README.md).

---

**Last Updated**: 2026-01-05
**PixEngine Version**: 0.2.0
**Test Environment**: Node.js, Sharp Engine, Local Storage
