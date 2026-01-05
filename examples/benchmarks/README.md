# PixEngine Benchmark Suite

Comprehensive performance testing suite for PixEngine image optimization.

## 📊 What This Tests

This benchmark suite measures PixEngine's performance across:
- **Quality levels**: 50, 70, 85, 95
- **Formats**: WebP, AVIF, JPEG, PNG
- **Output sizes**: 200px, 500px, 800px, 1200px
- **Image types**: Solid colors, gradients, text, noise, UI, patterns

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run full benchmark suite
npm run all

# Or run steps individually:
npm run generate  # Generate test images
npm run bench     # Run benchmarks
npm run analyze   # Analyze results
```

## 📁 What Gets Generated

After running the benchmarks, you'll have:

```
examples/benchmarks/
├── test-images-generated/    # 11 synthetic test images
├── benchmark-output/          # Optimized variants (200+ files)
├── benchmark-results.json     # Raw test data
└── (console output)           # Analysis summary
```

## 📈 Expected Results

Based on our testing (see [docs/BENCHMARKS.md](../../docs/BENCHMARKS.md)):
- **Average reduction**: 79.4% across all tests
- **WebP**: 84.5% average (best all-around)
- **AVIF**: 83.0% average (excellent for gradients)
- **Thumbnails (200px)**: 96.1% reduction
- **Quality sweet spot**: 70-85

## 🔧 Scripts

### `generate-test-images.mjs`
Generates 11 synthetic test images with different characteristics:
- 3 solid colors
- 2 gradients
- 2 text overlays
- 1 noise pattern
- 1 checkerboard
- 1 UI mockup
- 1 mixed content

### `benchmark.mjs`
Runs comprehensive optimization tests on all generated images:
- Quality comparison (50, 70, 85, 95)
- Format comparison (WebP, AVIF, JPEG, PNG)
- Size comparison (200, 500, 800, 1200px)

Outputs results to `benchmark-results.json` (132 tests total).

### `analyze-results.mjs`
Analyzes the benchmark results and prints:
- Overall statistics
- Format performance comparison
- Quality impact analysis
- Size impact analysis
- Best performers by image type
- Key insights and recommendations

## 🎯 Use Cases

### For Users
- Validate PixEngine performance in your environment
- Compare with official benchmark results
- Test custom policies

### For Contributors
- Regression testing before releases
- Performance optimization verification
- Format/quality tuning

## ⚠️ Notes

- **Test images are synthetic**: Real-world photos may yield different results
- **Time to complete**: ~2-5 minutes for full suite (132 tests)
- **Disk space**: ~50-100MB for all generated files
- **Results may vary** based on Sharp version and system resources

## 📚 Learn More

- [Official Benchmark Results](../../docs/BENCHMARKS.md)
- [PixEngine Documentation](../../README_EN.md)
- [Policy Examples](../../docs/POLICY-EXAMPLES.md) _(coming soon)_

## 🤝 Contributing

Found issues or have suggestions for better test coverage? Please open an issue!

---

**Version**: 1.0.0
**PixEngine**: 0.2.0
**License**: MIT
