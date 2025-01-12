import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { items, store, credentials } = await req.json()
    console.log('Received request:', { items, store })

    const browser = await puppeteer.launch({ headless: true })
    const page = await browser.newPage()

    // Navigate to Shipt and login
    await page.goto('https://shop.shipt.com/')
    await page.type('#username', credentials.username)
    await page.type('#password', credentials.password)
    await page.click('button[type="submit"]')
    await page.waitForNavigation()

    // Select store
    await page.goto(`https://shop.shipt.com/store/${store}`)
    await page.waitForSelector('.store-products')

    const products = []
    
    // Search for each item
    for (const item of items) {
      await page.type('input[type="search"]', item)
      await page.keyboard.press('Enter')
      await page.waitForSelector('.product-card', { timeout: 5000 })

      // Get first product result
      const product = await page.evaluate(() => {
        const card = document.querySelector('.product-card')
        if (!card) return null

        return {
          name: card.querySelector('.product-name')?.textContent?.trim() || '',
          price: parseFloat(card.querySelector('.price')?.textContent?.replace('$', '') || '0'),
          image: card.querySelector('img')?.src || '',
          description: card.querySelector('.product-description')?.textContent?.trim() || '',
          quantity: 1
        }
      })

      if (product) {
        products.push(product)
      }
    }

    await browser.close()
    
    return new Response(
      JSON.stringify({ products }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})