import { NextApiRequest, NextApiResponse } from 'next'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_ART_API_KEY,
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { responses, sessionId } = req.body

    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({ error: 'Invalid responses provided' })
    }

    // Analyze multilayer responses to extract 4-axis information
    const axisData = {
      composition: '',
      elements: '',
      objects: '',
      mood: '',
    }

    // Extract responses by axis
    responses.forEach((response) => {
      if (response.axis && response.selectedValue && response.selectedLabel) {
        switch (response.axis) {
          case 'composition':
            axisData.composition = response.selectedLabel
            break
          case 'elements':
            axisData.elements = response.selectedLabel
            break
          case 'objects':
            axisData.objects = response.selectedLabel
            break
          case 'mood':
            axisData.mood = response.selectedLabel
            break
        }
      }
    })

    // Fallback for classic questions if multilayer data is incomplete
    if (
      !axisData.composition &&
      !axisData.elements &&
      !axisData.objects &&
      !axisData.mood
    ) {
      console.log('🔄 Using classic responses for poetry generation')

      // Simple mapping from classic responses
      responses.forEach((response) => {
        const answer = response.selectedAnswer.toLowerCase()

        // Composition mapping
        if (answer.includes('花火') || answer.includes('浴衣')) {
          axisData.composition = '祭りの正面から'
          axisData.objects = '花火と浴衣姿'
        } else if (answer.includes('屋台') || answer.includes('かき氷')) {
          axisData.composition = '屋台の裏路地から静かに'
          axisData.objects = '金魚すくいと屋台の賑わい'
        } else if (answer.includes('お神輿') || answer.includes('太鼓')) {
          axisData.composition = '橋の上から見下ろして'
          axisData.objects = 'お囃子と太鼓の音'
        }

        // Elements mapping
        if (answer.includes('友達')) {
          axisData.elements = '友達と一緒に'
        } else if (answer.includes('家族')) {
          axisData.elements = '家族と一緒に'
        } else if (answer.includes('一人')) {
          axisData.elements = '一人で'
        }

        // Mood mapping
        if (answer.includes('ワクワク') || answer.includes('楽しかった')) {
          axisData.mood = 'ワクワクして心が躍った'
        } else if (
          answer.includes('懐かしく') ||
          answer.includes('温かかった')
        ) {
          axisData.mood = '切なく懐かしい気持ちになった'
        } else if (answer.includes('神秘的') || answer.includes('心が震えた')) {
          axisData.mood = '静かで温かい気持ちに包まれた'
        }
      })
    }

    // Create poetry prompt
    const prompt = `あなたは日本の夏祭りの詩人です。以下の4つの要素から、美しい詩を作成してください。

【構図・視点】: ${axisData.composition}
【共に過ごす人】: ${axisData.elements} 
【印象的な要素】: ${axisData.objects}
【その時の気持ち】: ${axisData.mood}

要求：
1. 夏祭りの情景と感情を繊細に表現した詩を作成
2. 4つの要素すべてを自然に織り込む
3. 日本語の美しい表現を使用
4. **形式は3行以内の短詩（必須）**
5. 読み手の心に響く情感豊かな内容
6. 季語や日本的な表現を適度に使用
7. 改行は最大2回まで（3行構成）

**重要：必ず3行以内で完結させてください。長すぎる詩は画像からはみ出します。**

詩のみを出力してください（説明や前置きは不要）。`

    console.log('🎭 Generating poetry with axis data:', axisData)

    // Call GPT-4 API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.8, // Creative but not too random
      top_p: 0.9,
    })

    const generatedPoem = completion.choices[0]?.message?.content?.trim()

    if (!generatedPoem) {
      throw new Error('No poetry content received from GPT-4')
    }

    console.log(
      '✅ Poetry generated successfully:',
      generatedPoem.substring(0, 50) + '...'
    )

    return res.status(200).json({
      poem: generatedPoem,
      metadata: {
        createdAt: new Date(),
        sessionId,
        axis: axisData,
        style: 'free_verse',
      },
    })
  } catch (error) {
    console.error('❌ Poetry generation error:', error)

    // Return fallback poetry if GPT-4 fails
    const fallbackPoem = generateFallbackPoetry()

    return res.status(200).json({
      poem: fallbackPoem,
      metadata: {
        createdAt: new Date(),
        sessionId: req.body.sessionId || 'unknown',
        axis: {
          composition: '夏祭りの夜',
          elements: '大切な人と',
          objects: '美しい光景',
          mood: '心に響く想い',
        },
        style: 'free_verse',
        fallback: true,
      },
    })
  }
}

// Fallback poetry generation
function generateFallbackPoetry(): string {
  return `夏祭りの夜
大切な人と
美しい光景の
想い出に
心に響く想い
この瞬間を
心に刻もう`
}
