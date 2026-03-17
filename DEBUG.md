# Debug Guide for Common Issues

## Issue: `@next/swc-darwin-arm64` not installed / `turbo.createProject` is not supported by the wasm bindings

### Error Symptoms
```
⚠ Attempted to load @next/swc-darwin-arm64, but it was not installed
Error: `turbo.createProject` is not supported by the wasm bindings.
```

### Cause
Next.js 16's native SWC compiler for Apple Silicon (darwin-arm64) isn't properly installed or the native bindings are corrupted.

### Fix

1. **Clean reinstall** (recommended):
   ```bash
   rm -rf node_modules package-lock.json .next
   npm install
   npm run dev
   ```

2. **Alternative: Use Turbopack flag** (if issue persists):
   ```bash
   npm run dev -- --turbo
   ```

3. **Force SWC platform** (rarely needed):
   ```bash
   npm install @next/swc-darwin-arm64 --save-optional
   ```

### Prevention
- Always use `npm install` after pulling changes to `package.json`
- Don't copy `node_modules` between different architectures (Intel Mac → Apple Silicon)

---

## Other Common Commands

### Reset everything
```bash
rm -rf node_modules package-lock.json .next
npm install
```

### Clear Next.js cache only
```bash
rm -rf .next
npm run dev
```

### Check Node version
```bash
node --version  # Should be v18+ for Next.js 16
```
