import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

export interface DareCatalogProduct {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  type: 'one_time';
  amount: number; // in pence (GBP)
  currency: string;
  credAmount: number;
  bonusCred: number;
  popular?: boolean;
  metadata: Record<string, string>;
}

export const DARE_CRED_PACKS: DareCatalogProduct[] = [
  {
    id: 'dare_cred_pack_150',
    name: 'Starter Pack',
    description: '150 Cred instant top-up. Perfect for funding your first challenges and cheering community proof.',
    imageUrl: '/assets/products/cred_starter_pack.png',
    type: 'one_time',
    amount: 99, // £0.99
    currency: 'gbp',
    credAmount: 150,
    bonusCred: 0,
    metadata: {
      itemType: 'cred_pack',
      credTotal: '150',
      bonusCred: '0',
    },
  },
  {
    id: 'dare_cred_pack_550',
    name: 'Booster Pack',
    description: '550 Cred (+10% Bonus Cred included). Great for creating multiple open dares and joining challenge pots.',
    imageUrl: '/assets/products/cred_booster_pack.png',
    type: 'one_time',
    amount: 299, // £2.99
    currency: 'gbp',
    credAmount: 500,
    bonusCred: 50,
    metadata: {
      itemType: 'cred_pack',
      credTotal: '550',
      bonusCred: '50',
    },
  },
  {
    id: 'dare_cred_pack_1250',
    name: 'Popular Creator Pack',
    description: '1,250 Cred (+25% Bonus Cred included). Most popular pack for active creators and viral dare creators.',
    imageUrl: '/assets/products/cred_creator_pack.png',
    type: 'one_time',
    amount: 499, // £4.99
    currency: 'gbp',
    credAmount: 1000,
    bonusCred: 250,
    popular: true,
    metadata: {
      itemType: 'cred_pack',
      credTotal: '1250',
      bonusCred: '250',
    },
  },
  {
    id: 'dare_cred_pack_3350',
    name: 'Influencer Pack',
    description: '3,350 Cred (+35% Bonus Cred included). High-stake challenge fund, leaderboard boosts, and store rewards.',
    imageUrl: '/assets/products/cred_influencer_pack.png',
    type: 'one_time',
    amount: 999, // £9.99
    currency: 'gbp',
    credAmount: 2500,
    bonusCred: 850,
    metadata: {
      itemType: 'cred_pack',
      credTotal: '3350',
      bonusCred: '850',
    },
  },
];

export const DARE_PRODUCTS = DARE_CRED_PACKS;

const defaultBaseUrl = process.env.APP_URL || 'https://ais-pre-f2jev5e77tancw47utwpz2-604116600759.europe-west2.run.app';
function resolveStripeImageUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${defaultBaseUrl.replace(/\/$/, '')}${url}`;
}

export async function syncStripeCatalog(customKey?: string) {
  const stripeKey = customKey || process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured in environment variables.');
  }

  const stripe = new Stripe(stripeKey);
  console.log('🚀 Initiating automated Stripe Catalog Synchronization...');
  console.log(`Connecting to Stripe account with key prefix: ${stripeKey.substring(0, 7)}...`);

  const existingAll = await stripe.products.list({ limit: 100, active: true });
  console.log(`Found ${existingAll.data.length} active products in Stripe account.`);

  const results = [];

  // Archive legacy Cred pack products (keep DARE Pro subscriptions intact)
  for (const p of existingAll.data) {
    if (p.name.startsWith('DARE Pro')) continue; // Keep Pro subscriptions intact
    const metaId = p.metadata?.dareday_item_id;
    const isOurPack = DARE_CRED_PACKS.some(pack => pack.id === metaId || pack.name.toLowerCase() === p.name.toLowerCase());
    if (!isOurPack) {
      try {
        console.log(`  archive: Archiving legacy Stripe product: ${p.name} (${p.id})`);
        await stripe.products.update(p.id, { active: false });
      } catch (err: any) {
        console.error(`  ✕ Failed to archive product ${p.id}:`, err.message);
      }
    }
  }

  for (const item of DARE_CRED_PACKS) {
    try {
      console.log(`\n📦 Processing Cred Pack: ${item.name} (${item.id})...`);
      
      let product: Stripe.Product | undefined = existingAll.data.find(p => {
        const metaId = p.metadata?.dareday_item_id;
        if (metaId === item.id) return true;
        if (p.name.toLowerCase() === item.name.toLowerCase()) return true;
        return false;
      });

      if (product) {
        console.log(`  ✓ Product exists: ${product.id}`);
        // Update product details to match exact names & descriptions
        product = await stripe.products.update(product.id, {
          active: true,
          name: item.name,
          description: item.description,
          images: item.imageUrl ? [resolveStripeImageUrl(item.imageUrl)!] : undefined,
          tax_code: 'txcd_10000000',
          metadata: {
            dareday_item_id: item.id,
            item_type: 'cred_pack',
            ...item.metadata,
          },
        });
      } else {
        console.log(`  + Creating new product for: ${item.name}`);
        product = await stripe.products.create({
          name: item.name,
          description: item.description,
          images: item.imageUrl ? [resolveStripeImageUrl(item.imageUrl)!] : undefined,
          tax_code: 'txcd_10000000',
          metadata: {
            dareday_item_id: item.id,
            item_type: 'cred_pack',
            ...item.metadata,
          },
        });
      }

      const prices = await stripe.prices.list({ product: product.id, active: true });
      let matchingPrice = prices.data.find(pr => pr.unit_amount === item.amount && pr.currency === item.currency && !pr.recurring);

      if (matchingPrice) {
        console.log(`  ✓ Matching one-time price exists: ${matchingPrice.id} (£${(item.amount / 100).toFixed(2)})`);
      } else {
        console.log(`  + Creating new one-time price: £${(item.amount / 100).toFixed(2)} ${item.currency.toUpperCase()}`);
        matchingPrice = await stripe.prices.create({
          product: product.id,
          unit_amount: item.amount,
          currency: item.currency,
          metadata: {
            dareday_item_id: item.id,
            cred_total: (item.credAmount + item.bonusCred).toString(),
          },
        });
      }

      results.push({ product, price: matchingPrice });
    } catch (err: any) {
      console.error(`  ✕ Error syncing pack ${item.id}:`, err.message);
    }
  }

  return results;
}

// Self-execute when run directly via CLI
if (process.argv[1]?.includes('sync-stripe-catalog')) {
  syncStripeCatalog()
    .then((results) => {
      console.log(`\n🎉 Successfully synced ${results.length} Cred packs with Stripe!`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('\n❌ Stripe catalog sync failed:', err);
      process.exit(1);
    });
}
