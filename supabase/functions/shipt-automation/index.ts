import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { items, store, credentials } = await req.json()
    console.log('Starting Shipt automation for store:', store)

    // For testing/demo purposes, return mock data
    const mockProducts = items.map(item => ({
      name: item,
      price: (Math.random() * 10 + 1).toFixed(2),
      image: 'https://via.placeholder.com/150',
      description: `Mock product for ${item}`,
      quantity: 1
    }));

    const mockStores = [
      {
        name: "H-E-B",
        address: "123 Main St, Austin, TX",
        image: "https://via.placeholder.com/150",
        latitude: 30.2672,
        longitude: -97.7431
      },
      {
        name: "Target",
        address: "456 Oak St, Austin, TX",
        image: "https://via.placeholder.com/150",
        latitude: 30.2672,
        longitude: -97.7431
      }
    ];

    const selectedStore = mockStores.find(s => 
      s.name?.toLowerCase().includes('h-e-b') || 
      s.name?.toLowerCase().includes(store.toLowerCase())
    ) || mockStores[0];

    console.log('Successfully processed request with mock data');
    
    return new Response(
      JSON.stringify({ 
        stores: mockStores,
        products: mockProducts,
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
    console.error('Automation error:', error);
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