import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

export interface DareCatalogProduct {
  id: string;
  name: string;
  description: string;
  type: 'recurring' | 'one_time';
  interval?: 'month' | 'year';
  amount: number;
  currency: string;
  metadata: Record<string, string>;
}

export const DARE_PRODUCTS: DareCatalogProduct[] = [
  {
    id: 'dare_pro_lite_monthly',
    name: 'DARE Pro Lite — Monthly',
    description: 'Pro Status Lite — Budget Friendly. Exclusive Gold PRO Badge, Daily Stipend Multiplier (120 CR/day), Basic Custom Dare Creation.',
    type: 'recurring',
    interval: 'month',
    amount: 99, // $0.99
    currency: 'usd',
    metadata: {
      tier: 'lite',
      billing: 'monthly',
      role: 'pro_lite',
    },
  },
  {
    id: 'dare_pro_lite_yearly',
    name: 'DARE Pro Lite — Annual',
    description: 'Full year of Pro Lite with 2 months free ($9.99/year). Exclusive Gold PRO badge, 120 CR daily stipend, basic custom dare creations.',
    type: 'recurring',
    interval: 'year',
    amount: 999, // $9.99
    currency: 'usd',
    metadata: {
      tier: 'lite',
      billing: 'yearly',
      role: 'pro_lite',
    },
  },
  {
    id: 'dare_pro_elite_monthly',
    name: 'DARE Pro Elite — Monthly',
    description: 'Most Popular — Best Value. Exclusive Gold PRO Badge, AI Challenge Oracle, Premium Card Highlights, Streak Loss Protection, 250 CR/day Stipend.',
    type: 'recurring',
    interval: 'month',
    amount: 199, // $1.99
    currency: 'usd',
    metadata: {
      tier: 'elite',
      billing: 'monthly',
      role: 'pro_elite',
    },
  },
  {
    id: 'dare_pro_elite_yearly',
    name: 'DARE Pro Elite — Annual',
    description: 'Full year of Pro Elite with 2 months free ($19.99/year). Includes AI Challenge Oracle, card highlights, streak shields, and 250 CR daily stipend.',
    type: 'recurring',
    interval: 'year',
    amount: 1999, // $19.99
    currency: 'usd',
    metadata: {
      tier: 'elite',
      billing: 'yearly',
      role: 'pro_elite',
    },
  },
  {
    id: 'dare_pro_ultra_monthly',
    name: 'DARE Pro Ultra — Monthly',
    description: 'Ultimate Unrestricted — Full Unlock. Exclusive Gold PRO Badge, Unlimited AI Challenge Oracle, Priority Badge & Custom Aura Frame, 3x Voting Power, 450 CR/day Stipend.',
    type: 'recurring',
    interval: 'month',
    amount: 399, // $3.99
    currency: 'usd',
    metadata: {
      tier: 'ultra',
      billing: 'monthly',
      role: 'pro_ultra',
    },
  },
  {
    id: 'dare_pro_ultra_yearly',
    name: 'DARE Pro Ultra — Annual',
    description: 'Full year of Pro Ultra with 2 months free ($39.99/year). Ultimate status, unlimited AI prompts, custom aura frame, 3x voting power, 450 CR/day stipend.',
    type: 'recurring',
    interval: 'year',
    amount: 3999, // $39.99
    currency: 'usd',
    metadata: {
      tier: 'ultra',
      billing: 'yearly',
      role: 'pro_ultra',
    },
  },
  {
    id: 'dare_battle_pass_s1',
    name: 'Season 1 Battle Pass: Elite Track',
    description: 'Unlock 50 premium tier rewards, exclusive weapon/cyberdeck cosmetics, 1,500 Cred return, and the Legendary Netrunner Prime title.',
    type: 'one_time',
    amount: 499, // $4.99
    currency: 'usd',
    metadata: {
      itemType: 'battle_pass',
      season: 'season_1',
    },
  },
  {
    id: 'dare_cred_pack_500',
    name: 'Cyber Cred Starter Pack (500 Cred + Cryo-Shield)',
    description: 'Instant injection of 500 Cred + 1x Cryo-Shield streak protector item for the Cyber Armory.',
    type: 'one_time',
    amount: 199, // $1.99
    currency: 'usd',
    metadata: {
      itemType: 'cred_pack',
      credAmount: '500',
    },
  },
  {
    id: 'dare_cred_pack_2500',
    name: 'Cyber Cred Vault (2,500 Cred + Rare Matrix Frame)',
    description: 'High-roller bankroll of 2,500 Cred + animated Matrix Glitch avatar frame.',
    type: 'one_time',
    amount: 499, // $4.99
    currency: 'usd',
    metadata: {
      itemType: 'cred_pack',
      credAmount: '2500',
    },
  },
  {
    id: 'dare_booster_bundle',
    name: 'Armory Tactical Booster Bundle',
    description: 'Includes 3x Quantum Oracle Reroll tokens and 2x Cryo-Shield Streak Freezes.',
    type: 'one_time',
    amount: 99, // $0.99
    currency: 'usd',
    metadata: {
      itemType: 'armory_bundle',
    },
  },
];

export async function syncStripeCatalog(customKey?: string) {
  const stripeKey = customKey || process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured in environment variables.');
  }

  const stripe = new Stripe(stripeKey);
  console.log('🚀 Initiating automated Stripe Catalog Synchronization...');
  console.log(`Connecting to Stripe account with key prefix: ${stripeKey.substring(0, 7)}...`);

  const results = [];

  for (const item of DARE_PRODUCTS) {
    try {
      console.log(`\n📦 Processing product: ${item.name} (${item.id})...`);
      
      // Check if product already exists
      const existingProducts = await stripe.products.search({
        query: `metadata['dareday_item_id']:'${item.id}'`,
      });

      let product: Stripe.Product;

      if (existingProducts.data.length > 0) {
        product = existingProducts.data[0];
        console.log(`  ✓ Product already exists (ID: ${product.id}). Updating metadata and description...`);
        product = await stripe.products.update(product.id, {
          name: item.name,
          description: item.description,
          metadata: {
            ...item.metadata,
            dareday_item_id: item.id,
            updated_at: new Date().toISOString(),
          },
        });
      } else {
        console.log(`  + Creating new Stripe product...`);
        product = await stripe.products.create({
          name: item.name,
          description: item.description,
          metadata: {
            ...item.metadata,
            dareday_item_id: item.id,
            created_at: new Date().toISOString(),
          },
        });
        console.log(`  ✓ Created product ID: ${product.id}`);
      }

      // Check for price
      const existingPrices = await stripe.prices.list({
        product: product.id,
        active: true,
      });

      let price: Stripe.Price | undefined = existingPrices.data.find(p => 
        p.unit_amount === item.amount &&
        p.currency === item.currency &&
        (item.type === 'recurring' ? p.recurring?.interval === item.interval : !p.recurring)
      );

      if (!price) {
        console.log(`  + Creating new Price for product ($${(item.amount / 100).toFixed(2)} ${item.currency.toUpperCase()})...`);
        const priceCreateParams: Stripe.PriceCreateParams = {
          product: product.id,
          unit_amount: item.amount,
          currency: item.currency,
          metadata: {
            dareday_item_id: item.id,
          },
        };

        if (item.type === 'recurring' && item.interval) {
          priceCreateParams.recurring = {
            interval: item.interval,
          };
        }

        price = await stripe.prices.create(priceCreateParams);
        console.log(`  ✓ Created Price ID: ${price.id}`);
      } else {
        console.log(`  ✓ Active Price already exists (ID: ${price.id})`);
      }

      results.push({
        daredayId: item.id,
        productId: product.id,
        priceId: price.id,
        name: item.name,
        amount: item.amount,
        type: item.type,
      });
    } catch (err: any) {
      console.error(`  ❌ Error processing ${item.id}:`, err.message);
      results.push({
        daredayId: item.id,
        error: err.message,
      });
    }
  }

  // Automatically archive old products from previous iterations
  try {
    console.log('🧹 Checking for legacy products to archive...');
    const allProducts = await stripe.products.list({ limit: 100, active: true });
    const currentItemIds = new Set(DARE_PRODUCTS.map(p => p.id));

    for (const prod of allProducts.data) {
      const legacyId = prod.metadata?.dareday_item_id;
      // If product has old prefix 'dareday_' or doesn't match current catalog
      if (legacyId && !currentItemIds.has(legacyId) && legacyId.startsWith('dareday_')) {
        console.log(`  Archiving obsolete legacy product: ${prod.name} (${prod.id})`);
        await stripe.products.update(prod.id, { active: false });
      }
    }
  } catch (cleanErr: any) {
    console.warn('Notice: Legacy archiving skipped:', cleanErr.message);
  }

  console.log('\n========================================');
  console.log('🎉 Stripe Catalog Sync Completed!');
  console.log(`Total items processed: ${results.length}`);
  console.log('========================================\n');
  return results;
}

// Run immediately when executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  syncStripeCatalog()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal sync failure:', err);
      process.exit(1);
    });
}
