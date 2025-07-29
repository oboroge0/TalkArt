// API Route for sharing artwork
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // In a real implementation, this would fetch from a database
    // For now, we'll return a simple HTML page
    const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>夏祭りの思い出アート - TalkArt</title>
  <meta property="og:title" content="夏祭りの思い出アート" />
  <meta property="og:description" content="AIが描いた夏祭りの思い出をご覧ください" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="/api/talkart/image/${id}" />
  <meta name="twitter:card" content="summary_large_image" />
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(to bottom, #4c1d95, #5b21b6);
      color: white;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      text-align: center;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    .artwork {
      background: white;
      padding: 8px;
      border-radius: 8px;
      display: inline-block;
      margin-bottom: 2rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    }
    .artwork img {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
    }
    .cta {
      display: inline-block;
      background: #fbbf24;
      color: #4c1d95;
      padding: 12px 32px;
      border-radius: 9999px;
      text-decoration: none;
      font-weight: bold;
      transition: transform 0.2s;
    }
    .cta:hover {
      transform: scale(1.05);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>夏祭りの思い出アート</h1>
    <div class="artwork">
      <img src="/api/talkart/image/${id}" alt="Generated artwork" />
    </div>
    <p>AIが描いた特別な夏祭りの思い出です</p>
    <a href="/" class="cta">あなたも作ってみる</a>
  </div>
</body>
</html>
    `

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.status(200).send(html)
  } catch (error) {
    console.error('Share page error:', error)
    res.status(500).json({ error: 'Failed to generate share page' })
  }
}
