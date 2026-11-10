import { db } from '@/lib/db'
import { getSessionUser, requireAuth, json } from '@/lib/auth'
import { inr, parseJson } from '@/lib/helpers'
import { aiEngineEnabled, engineJson } from '@/lib/ai-engine'
import { loadEngineCatalog } from '@/lib/ai-catalog'

export const maxDuration = 60

// POST /api/v1/assistant — AI Fashion Assistant (LLM with live catalog context)
export async function POST(req: Request) {
  const user = await getSessionUser()
  const denied = requireAuth(user)
  if (denied) return denied

  try {
    const { messages } = await req.json()
    const lastUserMsg: string = Array.isArray(messages)
      ? [...messages].reverse().find((m: { role: string }) => m.role === 'user')?.content || ''
      : ''
    if (!lastUserMsg) return json({ error: 'Ask me something about fashion 🙌' }, 400)

    // 1) Preferred path: the Python AI engine (preference extraction + ranking + LLM reply),
    //    fed with the live catalog from this app's database.
    if (aiEngineEnabled()) {
      try {
        const list = Array.isArray(messages) ? (messages as { role: string; content: string }[]) : []
        const lastIdx = list.map((m) => m.role).lastIndexOf('user')
        const history = list
          .slice(0, lastIdx)
          .slice(-8)
          .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content).slice(0, 2000) }))
        const out = await engineJson<{ reply: string }>('/api/v1/assistant/chat', {
          message: String(lastUserMsg).slice(0, 1500),
          history,
          location: user!.city || undefined,
          catalog: await loadEngineCatalog(),
        }, 45_000)
        if (out.reply) return json({ reply: out.reply, source: 'ai-engine' })
      } catch (engineErr) {
        console.error('assistant: AI engine failed, using built-in fallback', engineErr)
      }
    }

    // 2) Fallback: original in-app LLM path (unchanged below)

    // Pull live catalog context (products + tailors) — never let the LLM invent data
    const [products, sellers] = await Promise.all([
      db.product.findMany({
        where: { status: 'ACTIVE' },
        include: { seller: true, category: true },
        orderBy: { soldCount: 'desc' },
        take: 24,
      }),
      db.sellerProfile.findMany({ where: { verificationStatus: 'VERIFIED' }, take: 8 }),
    ])

    const catalog = products
      .map((p) => `- ${p.name} | ${p.category.name} | ${p.fabric} | ${inr(p.price)} | sizes ${parseJson<string[]>(p.sizes, []).join('/')} | shop: ${p.seller.shopName} | rating ${p.rating} (${p.ratingCount})`)
      .join('\n')
    const shopList = sellers.map((s) => `- ${s.shopName} | ${s.specialization} | ${s.city} | rating ${s.rating}`).join('\n')

    const system = `You are the AI Fashion Assistant for "AI Tailor", an Indian custom-tailoring marketplace. Answer in the user's language (English, Hindi or Marathi). Be warm, concise (max 120 words), use a few emojis. Recommend ONLY from this live catalog, quote exact names and prices, never invent prices/availability. Suggest follow-ups like budget, occasion, fabric.

LIVE CATALOG:
${catalog || 'No products available right now.'}

VERIFIED TAILOR SHOPS:
${shopList || 'No shops yet.'}`

    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: system },
       ...(Array.isArray(messages)
  ? messages.slice(-6).map((m: { role: string; content: string }) => ({
      role: (m.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: String(m.content).slice(0, 1000),
    }))
  : []),
      ],
    })

    const reply = completion.choices?.[0]?.message?.content || 'Sorry, I could not process that. Try asking about kurtas, sarees or budgets!'
    return json({ reply })
  } catch (e) {
    console.error('assistant POST error', e)
    return json({
      reply: 'I can help you pick outfits, set a budget and find tailors near you. Try: "मला लग्नासाठी 2000 रुपयात कुर्ता पाहिजे" or "Suggest a silk saree under ₹3000".',
    })
  }
}
