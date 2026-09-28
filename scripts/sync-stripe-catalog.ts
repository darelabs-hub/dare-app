import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

export interface DareCatalogProduct {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
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
    imageUrl: 'https://dare.me.uk/assets/pro-lite.png',
    type: 'recurring',
    interval: 'month',
    amount: 99, // £0.99
    currency: 'gbp',
    metadata: {
      tier: 'lite',
      billing: 'monthly',
      role: 'pro_lite',
    },
  },
  {
    id: 'dare_pro_lite_yearly',
    name: 'DARE Pro Lite — Annual',
    description: 'Full year of Pro Lite with 2 months free (£9.99/year). Exclusive Gold PRO badge, 120 CR daily stipend, basic custom dare creations.',
    imageUrl: 'https://dare.me.uk/assets/pro-lite.png',
    type: 'recurring',
    interval: 'year',
    amount: 999, // £9.99
    currency: 'gbp',
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
    imageUrl: 'https://dare.me.uk/assets/pro-elite.png',
    type: 'recurring',
    interval: 'month',
    amount: 199, // £1.99
    currency: 'gbp',
    metadata: {
      tier: 'elite',
      billing: 'monthly',
      role: 'pro_elite',
    },
  },
  {
    id: 'dare_pro_elite_yearly',
    name: 'DARE Pro Elite — Annual',
    description: 'Full year of Pro Elite with 2 months free (£19.99/year). Includes AI Challenge Oracle, card highlights, streak shields, and 250 CR daily stipend.',
    imageUrl: 'https://dare.me.uk/assets/pro-elite.png',
    type: 'recurring',
    interval: 'year',
    amount: 1999, // £19.99
    currency: 'gbp',
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
    imageUrl: 'https://dare.me.uk/assets/pro-ultra.png',
    type: 'recurring',
    interval: 'month',
    amount: 399, // £3.99
    currency: 'gbp',
    metadata: {
      tier: 'ultra',
      billing: 'monthly',
      role: 'pro_ultra',
    },
  },
  {
    id: 'dare_pro_ultra_yearly',
    name: 'DARE Pro Ultra — Annual',
    description: 'Full year of Pro Ultra with 2 months free (£39.99/year). Ultimate status, unlimited AI prompts, custom aura frame, 3x voting power, 450 CR/day stipend.',
    imageUrl: 'https://dare.me.uk/assets/pro-ultra.png',
    type: 'recurring',
    interval: 'year',
    amount: 3999, // £39.99
    currency: 'gbp',
    metadata: {
      tier: 'ultra',
      billing: 'yearly',
      role: 'pro_ultra',
    },
  },
  {
    id: 'dare_battle_pass_s1',
    name: 'Season 1 Pass: Elite Track',
    description: 'Unlock 50 premium tier rewards, exclusive cosmetic titles, 1,500 Cred return, and the Legendary DARE Champion title.',
    imageUrl: 'https://dare.me.uk/assets/battle-pass.png',
    type: 'one_time',
    amount: 499, // £4.99
    currency: 'gbp',
    metadata: {
      itemType: 'battle_pass',
      season: 'season_1',
    },
  },
  {
    id: 'dare_cred_pack_500',
    name: 'DARE Cred Starter Pack (500 Creds + Streak Shield)',
    description: 'Instant pack of 500 Creds + 1x Streak Shield protector item for the Rewards Armory.',
    imageUrl: 'https://dare.me.uk/assets/cred-pack.png',
    type: 'one_time',
    amount: 199, // £1.99
    currency: 'gbp',
    metadata: {
      itemType: 'cred_pack',
      credAmount: '500',
    },
  },
  {
    id: 'dare_cred_pack_2500',
    name: 'DARE Cred Vault (2,500 Creds + VIP Avatar Frame)',
    description: 'High-roller bankroll of 2,500 Creds + animated VIP Hologram avatar frame.',
    imageUrl: 'https://dare.me.uk/assets/cred-pack.png',
    type: 'one_time',
    amount: 499, // £4.99
    currency: 'gbp',
    metadata: {
      itemType: 'cred_pack',
      credAmount: '2500',
    },
  },
  {
    id: 'dare_booster_bundle',
    name: 'DARE Tactical Booster Pack',
    description: 'Includes 3x Oracle Reroll tokens and 2x Streak Freeze Protectors.',
    imageUrl: 'https://dare.me.uk/assets/booster.png',
    type: 'one_time',
    amount: 99, // £0.99
    currency: 'gbp',
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

  // Fetch all existing products from Stripe account (both active and archived)
  const existingAll = await stripe.products.list({ limit: 100 });
  console.log(`Found ${existingAll.data.length} existing products in Stripe account.`);

  const results = [];

  for (const item of DARE_PRODUCTS) {
    try {
      console.log(`\n📦 Processing product: ${item.name} (${item.id})...`);
      
      // Match by metadata ID, name, or legacy names
      let product: Stripe.Product | undefined = existingAll.data.find(p => {
        const metaId = p.metadata?.dareday_item_id;
        if (metaId === item.id) return true;
        if (p.name.toLowerCase() === item.name.toLowerCase()) return true;
        if (item.id === 'dare_cred_pack_500' && (p.name.includes('500 Cred') || p.name.includes('Starter Pack'))) return true;
        if (item.id === 'dare_cred_pack_2500' && (p.name.includes('2,500 Cred') || p.name.includes('Vault'))) return true;
        if (item.id === 'dare_battle_pass_s1' && (p.name.includes('Battle Pass') || p.name.includes('Season 1'))) return true;
        if (item.id === 'dare_booster_bundle' && (p.name.includes('Booster') || p.name.includes('Tactical'))) return true;
        if (item.id === 'dare_pro_lite_yearly' && (p.name.includes('Lite') && (p.name.includes('Annual') || p.name.includes('Yearly')))) return true;
        if (item.id === 'dare_pro_elite_yearly' && (p.name.includes('Elite') && (p.name.includes('Annual') || p.name.includes('Yearly')))) return true;
        if (item.id === 'dare_pro_ultra_yearly' && (p.name.includes('Ultra') && (p.name.includes('Annual') || p.name.includes('Yearly')))) return true;
        if (item.id === 'dare_pro_lite_monthly' && (p.name.includes('Lite') && p.name.includes('Monthly'))) return true;
        if (item.id === 'dare_pro_elite_monthly' && (p.name.includes('Elite') && p.name.includes('Monthly'))) return true;
        if (item.id === 'dare_pro_ultra_monthly' && (p.name.includes('Ultra') && p.name.includes('Monthly'))) return true;
        return false;
      });

      if (product) {
        console.log(`  ✓ Updating and setting ACTIVE on product (ID: ${product.id})...`);
        product = await stripe.products.update(product.id, {
          name: item.name,
          description: item.description,
          active: true, // EXPLICITLY ACTIVATE IN STRIPE
          tax_code: 'txcd_10000000',
          images: item.imageUrl ? [item.imageUrl] : undefined,
          metadata: {
            ...item.metadata,
            dareday_item_id: item.id,
            updated_at: new Date().toISOString(),
          },
        });
      } else {
        console.log(`  + Creating new active Stripe product...`);
        product = await stripe.products.create({
          name: item.name,
          description: item.description,
          active: true, // EXPLICITLY ACTIVATE IN STRIPE
          tax_code: 'txcd_10000000',
          images: item.imageUrl ? [item.imageUrl] : undefined,
          metadata: {
            ...item.metadata,
            dareday_item_id: item.id,
            created_at: new Date().toISOString(),
          },
        });
        console.log(`  ✓ Created product ID: ${product.id}`);
      }

      // Check for price (with graceful fallback for restricted keys without plan_read permissions)
      let priceId: string = 'price_managed_in_checkout';
      try {
        const existingPrices = await stripe.prices.list({
          product: product.id,
          limit: 20,
        });

        let price: Stripe.Price | undefined = existingPrices.data.find(p => 
          p.unit_amount === item.amount &&
          p.currency === item.currency &&
          (item.type === 'recurring' ? p.recurring?.interval === item.interval : !p.recurring)
        );

        if (price) {
          if (!price.active) {
            console.log(`  ✓ Activating existing price ID: ${price.id}`);
            price = await stripe.prices.update(price.id, { active: true });
          } else {
            console.log(`  ✓ Active Price already exists (ID: ${price.id})`);
          }
          priceId = price.id;
        } else {
          console.log(`  + Creating new active Price ($${(item.amount / 100).toFixed(2)} ${item.currency.toUpperCase()})...`);
          const priceCreateParams: Stripe.PriceCreateParams = {
            product: product.id,
            unit_amount: item.amount,
            currency: item.currency,
            active: true,
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
          priceId = price.id;
        }
      } catch (priceErr: any) {
        console.warn(`  ⚠️ Note: Stripe restricted key lacks prices permission (${priceErr.message}). The product itself has been set to ACTIVE.`);
      }

      results.push({
        daredayId: item.id,
        productId: product.id,
        priceId,
        name: item.name,
        amount: item.amount,
        type: item.type,
        active: product.active,
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
      const isLegacyName = prod.name.includes('(Neon Netrunner)') || 
                           prod.name.includes('(Syndicate Overlord)') ||
                           prod.name.includes('(Neon Insurgency)') ||
                           prod.name.includes('Armory Tactical Booster Bundle') && !legacyId;
      if ((legacyId && legacyId.startsWith('dareday_')) || isLegacyName) {
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
