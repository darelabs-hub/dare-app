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
    id: 'dareday_pro_monthly',
    name: 'DARE Pro — Monthly (Neon Netrunner)',
    description: 'Unlock 2x Cred multiplier, custom profile badges, unlimited dare creations, and zero platform fees.',
    type: 'recurring',
    interval: 'month',
    amount: 999, // $9.99
    currency: 'usd',
    metadata: {
      tier: 'runner',
      billing: 'monthly',
      role: 'pro_netrunner',
    },
  },
  {
    id: 'dareday_pro_yearly',
    name: 'DARE Pro — Annual (Neon Netrunner)',
    description: 'Full year of Pro tier benefits + 2 months free + exclusive Neon Founder holo-badge.',
    type: 'recurring',
    interval: 'year',
    amount: 9900, // $99.00
    currency: 'usd',
    metadata: {
      tier: 'runner',
      billing: 'yearly',
      role: 'pro_netrunner',
    },
  },
  {
    id: 'dareday_elite_monthly',
    name: 'DARE Elite — Monthly (Syndicate Overlord)',
    description: 'Everything in Pro + 3x Cred multiplier, custom glowing animated frames, priority AI arbitrations, and weekly private drop zones.',
    type: 'recurring',
    interval: 'month',
    amount: 1999, // $19.99
    currency: 'usd',
    metadata: {
      tier: 'elite',
      billing: 'monthly',
      role: 'syndicate_overlord',
    },
  },
  {
    id: 'dareday_elite_yearly',
    name: 'DARE Elite — Annual (Syndicate Overlord)',
    description: 'Full year of Elite tier with VIP Syndicate status + 2 months free + 2,000 bonus Cred instantly.',
    type: 'recurring',
    interval: 'year',
    amount: 19900, // $199.00
    currency: 'usd',
    metadata: {
      tier: 'elite',
      billing: 'yearly',
      role: 'syndicate_overlord',
    },
  },
  {
    id: 'dareday_battle_pass_s1',
    name: 'Season 1 Battle Pass: Elite Track (Neon Insurgency)',
    description: 'Unlock 50 premium tier rewards, exclusive weapon/cyberdeck cosmetics, 1,500 Cred return, and the Legendary Netrunner Prime title.',
    type: 'one_time',
    amount: 999, // $9.99
    currency: 'usd',
    metadata: {
      itemType: 'battle_pass',
      season: 'season_1',
    },
  },
  {
    id: 'dareday_cred_pack_500',
    name: 'Cyber Cred Starter Pack (500 Cred + 1x Cryo-Shield)',
    description: 'Instant injection of 500 Cred + 1x Cryo-Shield streak protector item for the Cyber Armory.',
    type: 'one_time',
    amount: 499, // $4.99
    currency: 'usd',
    metadata: {
      itemType: 'cred_pack',
      credAmount: '500',
    },
  },
  {
    id: 'dareday_cred_pack_2500',
    name: 'Cyber Cred Vault (2,500 Cred + Rare Matrix Frame)',
    description: 'High-roller bankroll of 2,500 Cred + animated Matrix Glitch avatar frame.',
    type: 'one_time',
    amount: 1999, // $19.99
    currency: 'usd',
    metadata: {
      itemType: 'cred_pack',
      credAmount: '2500',
    },
  },
  {
    id: 'dareday_booster_bundle',
    name: 'Armory Tactical Booster Bundle',
    description: 'Includes 3x Quantum Oracle Reroll tokens and 2x Cryo-Shield Streak Freezes.',
    type: 'one_time',
    amount: 299, // $2.99
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
