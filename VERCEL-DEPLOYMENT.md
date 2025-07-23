# TalkArt Vercel Deployment Guide

## Prerequisites

1. Vercel account (https://vercel.com)
2. GitHub repository with TalkArt code
3. OpenAI API key for DALL-E 3 and GPT-4

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyour-username%2Ftalkart&env=NEXT_PUBLIC_ART_API_KEY,OPENAI_API_KEY&envDescription=API%20keys%20for%20art%20generation%20and%20chat&project-name=talkart&repository-name=talkart)

## Manual Deployment Steps

### 1. Prepare Your Repository

```bash
# Ensure all changes are committed
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Import to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project settings:
   - Framework Preset: Next.js
   - Root Directory: `aituber-kit/`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### 3. Configure Environment Variables

In Vercel Dashboard > Settings > Environment Variables, add:

#### Required Variables
```bash
# OpenAI API (for DALL-E 3 and chat)
NEXT_PUBLIC_ART_API_KEY=sk-...
OPENAI_API_KEY=sk-...

# TalkArt Mode
NEXT_PUBLIC_TALKART_MODE=true

# Art Generation
NEXT_PUBLIC_ART_API_ENDPOINT=dalle3
```

#### Optional Performance Variables
```bash
# Custom domain (if you have one)
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=...
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-...

# Feature flags
NEXT_PUBLIC_ENABLE_REALTIME_GALLERY=true
NEXT_PUBLIC_GALLERY_MAX_ITEMS=100
```

### 4. Deploy

Click "Deploy" and wait for the build to complete.

## Post-Deployment Configuration

### 1. Custom Domain

1. Go to Settings > Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### 2. Function Configuration

Our `vercel.json` already configures:
- 30s timeout for art generation
- 60s timeout for SSE streaming
- Optimized regions (Tokyo: hnd1)

### 3. Performance Monitoring

1. Enable Vercel Analytics:
   - Go to Analytics tab
   - Enable Web Vitals monitoring

2. Set up Speed Insights:
   - Monitor Core Web Vitals
   - Track user experience metrics

## Production Optimizations

### Image Optimization
- DALL-E images are automatically optimized
- Local images use Next.js Image Optimization
- WebP/AVIF formats for better compression

### Caching Strategy
- Static assets: 1 year cache
- API responses: Smart caching headers
- ISR for gallery pages (if needed)

### Code Splitting
- Automatic route-based splitting
- Dynamic imports for heavy components
- Optimized bundle sizes

## Environment-Specific Features

### Development vs Production

| Feature | Development | Production |
|---------|------------|------------|
| Error Details | Full stack traces | User-friendly messages |
| Source Maps | Enabled | Disabled |
| API Rate Limiting | Relaxed | Enforced |
| Image Optimization | Basic | Full optimization |
| Analytics | Disabled | Enabled |

### QR Code URLs

Production QR codes automatically use:
1. Custom domain (if set via `NEXT_PUBLIC_SITE_URL`)
2. Vercel URL (automatic)
3. Proper HTTPS protocol

## Troubleshooting

### Common Issues

1. **QR codes showing localhost**
   - Ensure `NEXT_PUBLIC_SITE_URL` is set
   - Check `getBaseUrl()` function in `talkArtResult.tsx`

2. **Images not loading**
   - Verify `images.domains` in `next.config.js`
   - Check CORS headers in `vercel.json`

3. **SSE not working**
   - Ensure function timeout is sufficient (60s)
   - Check browser console for connection errors

4. **Slow initial load**
   - Enable Vercel Edge Network
   - Check bundle size with `npm run analyze`

### Debug Mode

Add these query parameters for debugging:
- `?debug=true` - Show debug info
- `?perf=true` - Show performance metrics

## Scaling Considerations

### Traffic Handling
- Vercel automatically scales
- Consider API rate limits
- Monitor function invocations

### Storage
- Gallery uses localStorage (client-side)
- For production scale, consider:
  - Vercel KV for session data
  - Vercel Blob for image storage
  - External database for gallery

### Cost Optimization
- Monitor function invocations
- Use efficient image formats
- Implement proper caching
- Consider Edge Functions for simple APIs

## Security Best Practices

1. **API Keys**
   - Never commit `.env` files
   - Use Vercel's encrypted variables
   - Rotate keys regularly

2. **CORS**
   - Configure allowed origins
   - Restrict API methods

3. **Rate Limiting**
   - Implement per-IP limits
   - Use Vercel's Edge Middleware

## Maintenance

### Updates
```bash
# Update dependencies
npm update

# Test locally
npm run dev

# Deploy updates
git push origin main
```

### Monitoring
- Check Vercel Dashboard daily
- Monitor error rates
- Review performance metrics
- Check API usage/costs

## Support

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- TalkArt Issues: https://github.com/your-username/talkart/issues