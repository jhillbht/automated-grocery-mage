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
    console.log('Starting Shipt automation for store:', store)

    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    const page = await browser.newPage()
    
    console.log('Navigating to Shipt login page...')
    await page.goto('https://shop.shipt.com/login')
    
    // Wait for and fill login form
    await page.waitForSelector('#username')
    await page.type('#username', credentials.username)
    await page.type('#password', credentials.password)
    await page.click('button[type="submit"]')
    
    // Wait for login to complete
    await page.waitForNavigation()
    console.log('Successfully logged in')

    // Navigate to store selection
    await page.goto(`https://shop.shipt.com/stores`)
    await page.waitForSelector('[data-test="store-card"]')
    
    // Get available stores
    const stores = await page.evaluate(() => {
      const storeCards = document.querySelectorAll('[data-test="store-card"]')
      return Array.from(storeCards).map(card => ({
        name: card.querySelector('[data-test="store-name"]')?.textContent?.trim(),
        address: card.querySelector('[data-test="store-address"]')?.textContent?.trim(),
        image: card.querySelector('img')?.src
      }))
    })
    
    console.log(`Found ${stores.length} stores`)

    // Select the first store matching our store parameter
    const selectedStore = stores.find(s => s.name?.toLowerCase().includes(store.toLowerCase()))
    if (!selectedStore) {
      throw new Error(`Store ${store} not found`)
    }

    // Navigate to store page
    await page.goto(`https://shop.shipt.com/store/${store}`)
    await page.waitForSelector('[data-test="product-card"]')

    const products = []
    
    // Search for each item
    for (const item of items) {
      console.log(`Searching for item: ${item}`)
      
      // Clear existing search
      await page.click('[data-test="search-input"]')
      await page.keyboard.press('Control+A')
      await page.keyboard.press('Backspace')
      
      // Enter new search
      await page.type('[data-test="search-input"]', item)
      await page.keyboard.press('Enter')
      
      // Wait for search results
      await page.waitForSelector('[data-test="product-card"]', { timeout: 5000 })

      // Get first product result
      const product = await page.evaluate(() => {
        const card = document.querySelector('[data-test="product-card"]')
        if (!card) return null

        return {
          name: card.querySelector('[data-test="product-name"]')?.textContent?.trim() || '',
          price: parseFloat(card.querySelector('[data-test="product-price"]')?.textContent?.replace('$', '') || '0'),
          image: card.querySelector('img')?.src || '',
          description: card.querySelector('[data-test="product-description"]')?.textContent?.trim() || '',
          quantity: 1
        }
      })

      if (product) {
        console.log(`Found product: ${product.name}`)
        products.push(product)
      }
    }

    await browser.close()
    console.log('Automation completed successfully')
    
    return new Response(
      JSON.stringify({ 
        stores,
        products,
        selectedStore 
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Automation error:', error)
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