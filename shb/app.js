/**
 * AURA Beauty Intelligence
 * 4-Dashboard Guided Workflow & Recommendation Engine
 * Includes: Skincare, Hair Care, Body Care, Lip Care, and Eye Care
 * Features:
 *   - Real Brand Products (CeraVe, The Ordinary, SkinCeuticals, Olaplex, Kérastase, Dove, Sol de Janeiro, Laneige, etc.)
 *   - Budget-Friendly ($) vs. Expensive / Luxury ($$$) Interactive Filtering
 *   - What NOT to Use (Daily Avoidance Guide)
 */

// Application State
const state = {
    currentStep: 1, // 1: Login, 2: Categories, 3: Types, 4: Recommendations
    isLoggedIn: false,
    user: {
        id: null,
        username: '',
        full_name: '',
        email: ''
    },
    selectedCategory: 'skincare', // 'skincare' | 'haircare' | 'bodycare' | 'lipcare' | 'eyecare'
    selectedType: 'oily', // will be set according to category
    selectedConcerns: [],
    recFilter: 'all', // 'all' | 'AM' | 'PM'
    priceTierFilter: 'all', // 'all' | 'budget' | 'luxury'
    savedRoutine: []
};

// ============================================================================
// CURRENCY CONVERSION & FORMATTING (USD & INR: 1 USD ≈ 83 INR)
// ============================================================================
const USD_TO_INR_RATE = 83;

function formatINR(usdPrice) {
    if (usdPrice === undefined || usdPrice === null || isNaN(usdPrice)) return '0';
    const inr = Math.round(Number(usdPrice) * USD_TO_INR_RATE);
    return inr.toLocaleString('en-IN');
}

function formatDualPrice(usdPrice) {
    const usd = Number(usdPrice) || 0;
    return `$${usd.toFixed(2)} (₹${formatINR(usd)})`;
}

// Type Definitions for All 5 Categories
const categoryTypeDefinitions = {
    skincare: {
        title: 'What is your facial skin type?',
        desc: 'Select your primary skin condition when cleansed without moisturizers.',
        types: [
            {
                id: 'dry',
                emoji: '🌵',
                title: 'Dry Skin',
                desc: 'Feels tight, dehydrated, flaky, or lacks natural oil glow. Needs rich lipid nourishment.'
            },
            {
                id: 'oily',
                emoji: '✨',
                title: 'Oily Skin',
                desc: 'Prone to midday shine, enlarged pores, and excess sebum. Needs lightweight clarifying actives.'
            },
            {
                id: 'combination',
                emoji: '⚖️',
                title: 'Combination Skin',
                desc: 'Oily T-zone (forehead, nose, chin) with balanced or dry cheeks. Needs balanced dual-hydration.'
            },
            {
                id: 'sensitive',
                emoji: '🌸',
                title: 'Sensitive Skin',
                desc: 'Reactive, easily flushed, stings with harsh actives or synthetic fragrances. Needs barrier repair.'
            },
            {
                id: 'normal',
                emoji: '🌿',
                title: 'Normal / Balanced',
                desc: 'Even texture, comfortable hydration, rarely irritated or broken out. Needs daily maintenance.'
            }
        ],
        concerns: [
            { id: 'acne', label: 'Acne & Blemishes' },
            { id: 'dehydration', label: 'Dehydration & Dullness' },
            { id: 'redness', label: 'Redness & Rosacea' },
            { id: 'pores', label: 'Clogged Pores' },
            { id: 'hyperpigmentation', label: 'Dark Spots & Melasma' },
            { id: 'fine_lines', label: 'Fine Lines & Elasticity' }
        ]
    },

    haircare: {
        title: 'What is your hair & scalp profile?',
        desc: 'Select your natural strand pattern and primary scalp condition.',
        types: [
            {
                id: 'dry_frizz',
                emoji: '🍂',
                title: 'Dry & Frizzy Hair',
                desc: 'Lacks moisture, coarse cuticles, rough ends prone to humidity puffiness. Needs lipid sealing.'
            },
            {
                id: 'oily_scalp',
                emoji: '💧',
                title: 'Oily Scalp & Fine Hair',
                desc: 'Greasy roots requiring frequent washes, easily weighed down strands needing clarifying lift.'
            },
            {
                id: 'curly_coily',
                emoji: '➰',
                title: 'Curly & Coily Strands',
                desc: 'Patterned waves, spirals, or tight coils needing rich slip, elongation, and moisture butter.'
            },
            {
                id: 'damaged_color',
                emoji: '🧪',
                title: 'Damaged / Color-Treated',
                desc: 'Chemically bleached, heat-damaged, or fragile strands needing bio-identical peptide repair.'
            },
            {
                id: 'normal_hair',
                emoji: '⚖️',
                title: 'Balanced & Normal',
                desc: 'Healthy strand elasticity and balanced scalp microbiome. Needs gentle everyday maintenance.'
            }
        ],
        concerns: [
            { id: 'frizz', label: 'Frizz & Humidity Defense' },
            { id: 'color_damage', label: 'Bleach & Heat Protection' },
            { id: 'thinning', label: 'Volume & Density Boost' },
            { id: 'breakage', label: 'Split Ends & Bond Repair' }
        ]
    },

    bodycare: {
        title: 'What is your body skin condition?',
        desc: 'Select your primary body dermal characteristic and hydration needs.',
        types: [
            {
                id: 'very_dry',
                emoji: '🏜️',
                title: 'Intensely Dry / Flaky',
                desc: 'Ashy, tight, itchy skin needing 24-hour ceramide lipid balms and oat barrier comfort.'
            },
            {
                id: 'bumpy_kp',
                emoji: '🍓',
                title: 'Rough & Bumpy (KP)',
                desc: 'Strawberry skin or rough keratin plugs on arms and legs. Needs chemical lactic smoothing.'
            },
            {
                id: 'sensitive_body',
                emoji: '🛡️',
                title: 'Sensitive / Eczema-Prone',
                desc: 'Prone to contact redness, hives, and barrier flare-ups. Needs fragrance-free hypoallergenic care.'
            },
            {
                id: 'normal_body',
                emoji: '✨',
                title: 'Normal & Balanced',
                desc: 'Comfortable dermal texture seeking everyday hydration, firming botanicals, and UV defense.'
            }
        ],
        concerns: [
            { id: 'sun_protection', label: 'Broad-Spectrum UV Defense' },
            { id: 'rough_texture', label: 'Smoothing Keratosis Bumps' },
            { id: 'extreme_dryness', label: 'Deep 24h Barrier Hydration' },
            { id: 'loss_of_elasticity', label: 'Firming & Tone Recovery' }
        ]
    },

    lipcare: {
        title: 'What is your primary lip condition?',
        desc: 'Select the primary concern regarding your lip vermilion border and hydration.',
        types: [
            {
                id: 'chapped',
                emoji: '🏜️',
                title: 'Severely Chapped & Cracked',
                desc: 'Cracked fissures, bleeding edges, and persistent peeling needing deep peptide lipid recovery.'
            },
            {
                id: 'dry_lips',
                emoji: '🍂',
                title: 'Dry & Dehydrated Lips',
                desc: 'Lacks suppleness, feels tight under lip color, prone to mild vertical dehydration lines.'
            },
            {
                id: 'pigmented_lips',
                emoji: '🫐',
                title: 'Darkened / Pigmented Border',
                desc: 'Hyperpigmentation from sun exposure or dehydration. Needs antioxidant brightening & SPF 30.'
            },
            {
                id: 'sensitive_lips',
                emoji: '🌸',
                title: 'Sensitive / Cheilitis-Prone',
                desc: 'Stings easily from plumping balms, cinnamon, or mint. Needs hypoallergenic soothing cica.'
            },
            {
                id: 'normal_lips',
                emoji: '💋',
                title: 'Balanced / Daily Volume',
                desc: 'Healthy lip barrier seeking non-sticky glass shine, hyaluronic volume, and sun protection.'
            }
        ],
        concerns: [
            { id: 'peeling', label: 'Flaking & Peeling Skin' },
            { id: 'fine_lines', label: 'Vertical Lip Lines' },
            { id: 'sun_protection', label: 'Sun & UV Pigmentation' },
            { id: 'thinness', label: 'Loss of Plumpness' }
        ]
    },

    eyecare: {
        title: 'What is your primary under-eye concern?',
        desc: 'Select your focus area for delicate periorbital and eyelid tissue.',
        types: [
            {
                id: 'dark_circles',
                emoji: '🐼',
                title: 'Dark Circles & Shadows',
                desc: 'Vascular blue/purple undertones or brown hyperpigmentation beneath lower eyelids.'
            },
            {
                id: 'puffiness',
                emoji: '🎈',
                title: 'Puffiness & Morning Swelling',
                desc: 'Fluid retention, sluggish lymphatic drainage, and heavy under-eye bags upon waking.'
            },
            {
                id: 'fine_lines_eye',
                emoji: '⏳',
                title: 'Crow’s Feet & Fine Wrinkles',
                desc: 'Loss of orbital collagen, dynamic smile lines, and micro-creasing around eye corners.'
            },
            {
                id: 'dry_crepey',
                emoji: '🌵',
                title: 'Dry & Crepey Eye Contour',
                desc: 'Paper-thin, dry parchment texture lacking lipids, causing concealer to cake and crease.'
            },
            {
                id: 'sensitive_eyes',
                emoji: '🌸',
                title: 'Sensitive & Tearing Eyes',
                desc: 'Prone to watering, stinging, burning, or milia bumps from standard eye creams.'
            }
        ],
        concerns: [
            { id: 'vascular_shadows', label: 'Purple Vascular Shadows' },
            { id: 'morning_puffiness', label: 'Sluggish Lymphatic Drainage' },
            { id: 'eyelid_laxity', label: 'Upper Eyelid Laxity' },
            { id: 'thin_skin', label: 'Parchment-Thin Texture' }
        ]
    }
};

// ============================================================================
// WHAT NOT TO USE / AVOID DATABASE (CONTRAINDICATIONS & SAFE SWAPS)
// ============================================================================

const avoidanceDatabase = {
    skincare: {
        dry: [
            {
                name: 'High Alcohol Denat & Astringent Toners',
                reason: 'Evaporates rapidly and dissolves the stratum corneum lipid matrix, triggering severe flaking and tightness.',
                swap: 'Hydrating Milky Ceramide or Panthenol Essence'
            },
            {
                name: 'Physical Walnut & Apricot Seed Scrubs',
                reason: 'Micro-tears fragile, dry skin and accelerates moisture loss across the compromised barrier.',
                swap: 'Gentle Lactic Acid 5% or PHA Gluconolactone'
            },
            {
                name: 'Foaming Sodium Lauryl Sulfate Cleansers',
                reason: 'Alkaline surfactants strip essential natural moisturizing factors (NMF) from parched cells.',
                swap: 'Gentle Amino Acid Cream or Balm Cleanser'
            }
        ],
        oily: [
            {
                name: 'Heavy Comedogenic Oils (Pure Coconut & Cocoa Butter)',
                reason: 'Has a comedogenic rating of 4-5; easily traps excess sebum and dead skin cells inside follicular ducts.',
                swap: 'Lightweight Squalane, Jojoba, or Oil-Free Water Gels'
            },
            {
                name: 'Harsh Sulfate Stripping Cleansers',
                reason: 'Over-drying signals sebaceous glands to produce rebound excess oil within hours.',
                swap: 'Salicylic Acid (BHA 1.5%) + Zinc PCA Gel Cleanser'
            },
            {
                name: 'Daily Physical Abrasive Brushes',
                reason: 'Causes mechanical irritation that inflames blemishes and spreads acne-causing bacteria.',
                swap: 'Gentle Chemical Exfoliation 2-3x weekly'
            }
        ],
        combination: [
            {
                name: 'Heavy Occlusive Petrolatum across the T-Zone',
                reason: 'Traps sebum on nose and forehead while failing to properly hydrate dry cheeks.',
                swap: 'Dual-hydration: Gel on T-Zone, Cream on Cheeks'
            },
            {
                name: 'Alcohol-Based Mattifying Primers over Entire Face',
                reason: 'Parches cheek regions into tightness and flaking while only temporarily masking oil.',
                swap: 'Niacinamide 10% Oil-Balancing Serum'
            }
        ],
        sensitive: [
            {
                name: 'Synthetic Perfumes & Essential Oils (Citrus, Lavender)',
                reason: 'Fragrance terpenes are the #1 cause of allergic contact dermatitis and cutaneous stinging.',
                swap: '100% Fragrance-Free Hypoallergenic Formulas'
            },
            {
                name: 'High-Concentration Glycolic Acid & Unbuffered L-Ascorbic Acid',
                reason: 'Very low pH penetrates too aggressively, causing erythema, flushing, and burning sensations.',
                swap: 'Buffered 3-O-Ethyl Ascorbic Acid or Azelaic Acid 10%'
            },
            {
                name: 'Chemical UV Filters (Oxybenzone, Avobenzone)',
                reason: 'Can release exothermic thermal heat into reactive barriers, triggering rosacea flares.',
                swap: '100% Non-Nano Mineral Zinc Oxide SPF'
            }
        ],
        normal: [
            {
                name: 'Layering Retinol with Strong Exfoliating Acids at the Same Time',
                reason: 'Applying both in the exact same step risks unnecessary chemical barrier fatigue.',
                swap: 'Skin Cycling: Retinol on PM 1, AHA/BHA on PM 2'
            },
            {
                name: 'Skipping Daily Broad-Spectrum Sun Protection',
                reason: 'UVA radiation penetrates year-round, silently degrading collagen even on cloudy days.',
                swap: 'Daily Silk Mineral Fluid SPF 50+'
            }
        ]
    },

    haircare: {
        dry_frizz: [
            {
                name: 'Sodium Lauryl Sulfate (SLS) Stripping Shampoos',
                reason: 'Strips the protective F-layer of fatty acids from hair cuticles, leaving strands rough and straw-like.',
                swap: 'Sulfate-Free Plant Amino Acid Cleanser'
            },
            {
                name: 'Short-Chain Drying Alcohols (Isopropyl Alcohol, Alcohol Denat)',
                reason: 'Common in aerosol hairsprays; siphons moisture from the cortex and worsens humidity puffiness.',
                swap: 'Fatty Conditioning Alcohols (Cetyl, Stearyl)'
            }
        ],
        oily_scalp: [
            {
                name: 'Heavy Silicones & Pure Oils Applied Directly to Roots',
                reason: 'Clogs hair follicles, weighs down roots, and accelerates unsightly greasiness by midday.',
                swap: 'Clarifying Rosemary Scalp Serum (applied to roots only)'
            },
            {
                name: 'Co-Washing Only (Skipping Clarifying Washes)',
                reason: 'Conditioner-only washing cannot break down hardened sebum plugs at the follicle base.',
                swap: 'Gentle Clarifying Shampoo every 2-3 washes'
            }
        ],
        curly_coily: [
            {
                name: 'Non-Water-Soluble Silicones (Dimethicone without Clarifier)',
                reason: 'Builds a moisture-impermeable plastic film around curls, leading to chronic internal dehydration.',
                swap: 'Water-Soluble Silicones or Murumuru & Shea Butters'
            },
            {
                name: 'Dry Brushing with Fine-Tooth Combs',
                reason: 'Disrupts natural curl clumps, tears fragile bends, and creates instantaneous frizz halos.',
                swap: 'Wide-Tooth Detangler on Soaking Wet Hair with Conditioner'
            }
        ],
        damaged_color: [
            {
                name: 'High Heat Styling (>380°F / 190°C) without Thermal Shield',
                reason: 'Directly denatures and melts compromised keratin bonds and burns color pigments.',
                swap: 'Peptide Bond Repair Mask + Thermal Shield Spray'
            },
            {
                name: 'Clarifying Sulfate Shampoos on Fresh Color',
                reason: 'Opens cuticles wide, stripping away expensive dye molecules within 2-3 washes.',
                swap: 'Low-pH Color-Preserving Amino Acid Cleanse'
            }
        ],
        normal_hair: [
            {
                name: 'Over-Moisturizing with Heavy Hair Butters',
                reason: 'Weighs down healthy bounce and makes hair look limp and greasy.',
                swap: 'Lightweight Botanical Leave-In Fluid'
            }
        ]
    },

    bodycare: {
        very_dry: [
            {
                name: 'Scalding Hot Showers with Deodorant Bar Soaps',
                reason: 'Hot water (>40°C) combined with high-pH tallow soaps melts away body barrier lipids.',
                swap: 'Lukewarm Water + Ceramide Lipid Body Wash'
            },
            {
                name: 'Heavily Perfumed Body Mists on Dry, Itchy Skin',
                reason: 'High alcohol concentrations sting and exacerbate chronic barrier micro-fissures.',
                swap: 'Colloidal Oat 24hr Unscented Body Balm'
            }
        ],
        bumpy_kp: [
            {
                name: 'Aggressive Loofah & Abrasive Mitt Scrubbing',
                reason: 'Frictional scrubbing inflames hair follicles and causes hyperkeratinization (worse bumps).',
                swap: 'Chemical Lactic Acid 10% + Urea Smoothing Polish'
            },
            {
                name: 'Heavy Pore-Clogging Mineral Oil without Active Exfoliants',
                reason: 'Seals dead keratin flakes inside the hair pore without dissolving the core plug.',
                swap: 'Lactic Acid Lotion followed by Light Squalane'
            }
        ],
        sensitive_body: [
            {
                name: 'Fragrant Foaming Bubble Baths & Bath Bombs',
                reason: 'Synthetic colorants and foaming agents trigger intense eczema flare-ups and hives.',
                swap: 'Soap-Free Hypoallergenic Cleansing Oil'
            }
        ],
        normal_body: [
            {
                name: 'Skipping Sunscreen on Exposed Limbs & Neck',
                reason: 'Neck, decolletage, and arms show the earliest signs of solar elastosis and age spots.',
                swap: 'Radiant Glow Mineral Body Silk SPF 50'
            }
        ]
    },

    lipcare: {
        chapped: [
            {
                name: 'Camphor, Menthol, Eucalyptus & Phenol Balms',
                reason: 'Provides a cooling sensation but strips epidermal lipids, creating a vicious cycle of rebound dryness.',
                swap: 'Bio-Identical Ceramide NP & Peptide Lip Sleeping Butter'
            },
            {
                name: 'Physical Sugar Gritty Scrubs on Bleeding/Cracked Lips',
                reason: 'Tears fragile mucosal tissue and delays epithelial wound healing.',
                swap: 'Enzyme Smoothing Lip Balm or Thick Cica Salve'
            },
            {
                name: 'Licking Lips when They Feel Tight',
                reason: 'Digestive enzymes in saliva (amylase) actively break down delicate lip skin as water evaporates.',
                swap: 'Immediate application of an Occlusive Peptide Barrier Balm'
            }
        ],
        dry_lips: [
            {
                name: 'Matte Long-Wear Liquid Lipsticks without a Hydrating Base',
                reason: 'Volatile silicones and wax-heavy pigments absorb natural lip moisture rapidly.',
                swap: 'Hydrating Peptide Tint or Sheer SPF Balm'
            }
        ],
        pigmented_lips: [
            {
                name: 'Unprotected Sun Exposure without Lip SPF',
                reason: 'UV rays directly trigger melanocytes on the lip vermilion border, creating dark spots.',
                swap: 'Mineral Silk Lip Shield SPF 30+'
            }
        ],
        sensitive_lips: [
            {
                name: 'Cinnamon (Cinnamates) & Capsaicin Plumping Serums',
                reason: 'Plumps by inducing artificial chemical irritation; causes contact cheilitis and swollen peeling.',
                swap: 'Non-Stinging Multi-Molecular Hyaluronic Lip Nectar'
            }
        ],
        normal_lips: [
            {
                name: 'Using Expired or Mineral-Oil Based Vaseline Only without Hydration',
                reason: 'Petrolatum seals surface moisture but does not infuse deep water-soluble humectants.',
                swap: 'Humectant Hyaluronic Nectar topped with a Peptide Lipid Shield'
            }
        ]
    },

    eyecare: {
        dark_circles: [
            {
                name: 'Vigorous Eye Rubbing & Tug-Cleansing',
                reason: 'Periorbital skin is 0.5mm thick; friction ruptures delicate capillaries, darkening purple shadows.',
                swap: 'Gently Pat with Ring Finger & Use Chilled Metal Roll-On'
            },
            {
                name: 'Heavy Comedogenic Facial Creams Right under the Lash Line',
                reason: 'Causes milia (tiny white keratin cysts) and worsens morning fluid stagnation.',
                swap: 'Lightweight Caffeine 5% + EGCG Awakening Eye Fluid'
            }
        ],
        puffiness: [
            {
                name: 'Thick Occlusive Ointments Applied Immediately before Lying Flat',
                reason: 'Impedes lymphatic drainage during horizontal sleep, producing swollen under-eye bags upon waking.',
                swap: 'Caffeine Drainage Serum in AM, Light Peptide Gel in PM'
            }
        ],
        fine_lines_eye: [
            {
                name: 'High-Strength Facial Retinol (1%+) applied directly to Eye Lids',
                reason: 'Can cause severe chemical burns, redness, and permanent dry eye disease (meibomian gland damage).',
                swap: 'Ophthalmologist-Tested Gentle Bakuchiol or Low-Dose Eye Retinoid'
            },
            {
                name: 'Harsh Waterproof Eye Makeup Wipes',
                reason: 'Mechanical dragging breaks elastin fibers around orbital bone, accelerating crow’s feet.',
                swap: 'Bi-Phase Micellar Cleanser on a Soaked Soft Cotton Pad (press, do not drag)'
            }
        ],
        dry_crepey: [
            {
                name: 'Alcohol-based Setting Sprays & Powders Direct to Under-Eyes',
                reason: 'Siphons hydration from paper-thin skin, causing immediate crepey crinkling and concealer caking.',
                swap: 'Ceramide Squalane Rich Eye Cushion Balm'
            }
        ],
        sensitive_eyes: [
            {
                name: 'Chemical Sunscreens (Avobenzone) & Perfumed Lotions Near Eyes',
                reason: 'Migrates easily into tears, causing intense stinging, burning, and chronic tearing.',
                swap: '100% Mineral Zinc Oxide Eye Cream with SPF 30'
            }
        ]
    }
};

// ============================================================================
// REAL BRAND PRODUCT CATALOG (BUDGET-FRIENDLY & EXPENSIVE/LUXURY)
// ============================================================================

const masterProducts = [
    // ------------------------------------------------------------------------
    // SKINCARE (FACE) - BUDGET-FRIENDLY ($)
    // ------------------------------------------------------------------------
    {
        id: 101,
        category: 'skincare',
        tier: 'budget',
        name: 'Hydrating Facial Cleanser',
        brand: 'CeraVe',
        sub_type: 'Cleanser / Face Wash',
        routine_time: 'Both',
        step_order: 1,
        price: 14.99,
        description: 'Iconic dermatologist-developed non-foaming lotion cleanser with 3 essential ceramides and hyaluronic acid.',
        key_actives: 'Ceramides 1, 3, 6-II, Hyaluronic Acid, MVE Delivery',
        suitable_types: ['dry', 'sensitive', 'normal', 'combination'],
        targeted_concerns: ['dehydration', 'redness'],
        is_fragrance_free: true,
        rating: 4.9,
        instructions: 'Wet skin with lukewarm water. Massage cleanser into skin in a gentle, circular motion. Rinse.'
    },
    {
        id: 102,
        category: 'skincare',
        tier: 'budget',
        name: 'Foaming Facial Cleanser',
        brand: 'CeraVe',
        sub_type: 'Cleanser / Face Wash',
        routine_time: 'Both',
        step_order: 1,
        price: 15.49,
        description: 'Gentle gel-foaming wash that deeply purifies excess oil and sebum without disrupting the skin barrier.',
        key_actives: 'Ceramides 1, 3, 6-II, Niacinamide, Hyaluronic Acid',
        suitable_types: ['oily', 'combination'],
        targeted_concerns: ['acne', 'pores'],
        is_fragrance_free: true,
        rating: 4.8,
        instructions: 'Dispense into wet hands, lather across face avoiding eyes, and rinse thoroughly.'
    },
    {
        id: 103,
        category: 'skincare',
        tier: 'budget',
        name: 'Niacinamide 10% + Zinc 1%',
        brand: 'The Ordinary',
        sub_type: 'Active Serum',
        routine_time: 'Both',
        step_order: 2,
        price: 6.50,
        description: 'Cult-favorite water-based high-strength vitamin and mineral blemish serum to diminish enlarged pores and shine.',
        key_actives: 'Niacinamide 10%, Zinc PCA 1%',
        suitable_types: ['oily', 'combination', 'normal'],
        targeted_concerns: ['acne', 'pores', 'hyperpigmentation'],
        is_fragrance_free: true,
        rating: 4.7,
        instructions: 'Apply a few drops to the entire face morning and evening before heavier face creams.'
    },
    {
        id: 104,
        category: 'skincare',
        tier: 'budget',
        name: 'Salicylic Acid Acne Cleanser',
        brand: 'The INKEY List',
        sub_type: 'Cleanser / Face Wash',
        routine_time: 'Both',
        step_order: 1,
        price: 12.99,
        description: 'Gentle, lightly foaming BHA cleanser that penetrates pores to target breakouts, blackheads, and excess oil.',
        key_actives: 'Salicylic Acid 2%, Zinc Compound 1%, Allantoin',
        suitable_types: ['oily', 'combination'],
        targeted_concerns: ['acne', 'pores'],
        is_fragrance_free: true,
        rating: 4.8,
        instructions: 'Gently massage a raspberry-sized amount onto dampened face for 60 seconds. Rinse thoroughly.'
    },
    {
        id: 105,
        category: 'skincare',
        tier: 'budget',
        name: 'Daily Facial Moisturizer',
        brand: 'Vanicream',
        sub_type: 'Moisturizer',
        routine_time: 'Both',
        step_order: 3,
        price: 13.99,
        description: 'Ultra-gentle dermatologist-formulated lightweight lotion with 5 ceramides and squalane for reactive barriers.',
        key_actives: '5 Ceramides, Hyaluronic Acid, Squalane',
        suitable_types: ['dry', 'sensitive', 'combination'],
        targeted_concerns: ['redness', 'dehydration'],
        is_fragrance_free: true,
        rating: 4.9,
        instructions: 'Apply as needed to face day and night after serums.'
    },
    {
        id: 106,
        category: 'skincare',
        tier: 'budget',
        name: 'Skin Aqua Super Moisture Gel SPF 50+',
        brand: 'Rohto Mentholatum',
        sub_type: 'Sunscreen',
        routine_time: 'AM',
        step_order: 4,
        price: 13.50,
        description: 'Japanese watery sunscreen fluid that melts instantly with zero white cast, weight, or greasy finish.',
        key_actives: 'Super Hyaluronic Acid, Collagen, Amino Acids',
        suitable_types: ['dry', 'oily', 'combination', 'sensitive', 'normal'],
        targeted_concerns: ['sun_protection', 'dehydration'],
        is_fragrance_free: true,
        rating: 4.9,
        instructions: 'Smooth liberally over face and neck 15 minutes prior to UV exposure.'
    },
    {
        id: 107,
        category: 'skincare',
        tier: 'budget',
        name: 'Granactive Retinoid 2% in Squalane',
        brand: 'The Ordinary',
        sub_type: 'Night Treatment',
        routine_time: 'PM',
        step_order: 3,
        price: 11.80,
        description: 'Next-generation active retinoid complex that smooths fine lines and texture with zero irritation or peeling.',
        key_actives: 'Hydroxypinacolone Retinoate (HPR), Pure Plant Squalane',
        suitable_types: ['dry', 'combination', 'normal'],
        targeted_concerns: ['fine_lines', 'hyperpigmentation'],
        is_fragrance_free: true,
        rating: 4.8,
        instructions: 'Apply a few drops at night before face moisturizers. Do not combine with other strong acids.'
    },

    // ------------------------------------------------------------------------
    // SKINCARE (FACE) - EXPENSIVE / LUXURY ($$$)
    // ------------------------------------------------------------------------
    {
        id: 108,
        category: 'skincare',
        tier: 'luxury',
        name: 'C E Ferulic Combination Antioxidant Treatment',
        brand: 'SkinCeuticals',
        sub_type: 'Active Serum',
        routine_time: 'AM',
        step_order: 2,
        price: 182.00,
        description: 'Gold standard medical-grade vitamin C serum that delivers 8x environmental protection and neutralizes free radicals.',
        key_actives: '15% Pure L-Ascorbic Acid, 1% Alpha Tocopherol, 0.5% Ferulic Acid',
        suitable_types: ['dry', 'normal', 'combination'],
        targeted_concerns: ['hyperpigmentation', 'fine_lines'],
        is_fragrance_free: true,
        rating: 4.9,
        instructions: 'In the morning after cleansing, apply 4–5 drops to a dry face, neck, and chest.'
    },
    {
        id: 109,
        category: 'skincare',
        tier: 'luxury',
        name: 'The Dewy Skin Cream',
        brand: 'Tatcha',
        sub_type: 'Moisturizer',
        routine_time: 'Both',
        step_order: 3,
        price: 72.00,
        description: 'Rich, antioxidant-packed moisturizing cream that feeds skin with plumping hydration and a luminous Japanese dewy glow.',
        key_actives: 'Japanese Purple Rice, Hadasei-3 Trinity, Okinawa Algae',
        suitable_types: ['dry', 'sensitive', 'normal'],
        targeted_concerns: ['dehydration', 'fine_lines'],
        is_fragrance_free: false,
        rating: 4.8,
        instructions: 'Scoop a pearl-sized amount with the gold spoon. Massage gently onto face, neck, and decolletage.'
    },
    {
        id: 110,
        category: 'skincare',
        tier: 'luxury',
        name: 'Skin Perfecting 2% BHA Liquid Exfoliant',
        brand: 'Paula’s Choice',
        sub_type: 'Active Exfoliant / Toner',
        routine_time: 'Both',
        step_order: 2,
        price: 35.00,
        description: 'Global holy grail leave-on exfoliant that unclogs pores, clears stubborn blackheads, and smooths wrinkles.',
        key_actives: 'Salicylic Acid (BHA) 2%, Green Tea Leaf Extract',
        suitable_types: ['oily', 'combination'],
        targeted_concerns: ['acne', 'pores'],
        is_fragrance_free: true,
        rating: 4.9,
        instructions: 'Gently apply using fingers or a cotton pad over entire face. Do not rinse.'
    },
    {
        id: 111,
        category: 'skincare',
        tier: 'luxury',
        name: 'Protini Polypeptide Firming Cream',
        brand: 'Drunk Elephant',
        sub_type: 'Moisturizer',
        routine_time: 'Both',
        step_order: 3,
        price: 69.00,
        description: 'High-tech protein moisturizer combining 9 signal peptides, growth factors, and pygmy waterlily for instant bounce.',
        key_actives: '9 Signal Peptide Complex, Pygmy Waterlily Stem Cell, Amino Acids',
        suitable_types: ['oily', 'combination', 'normal'],
        targeted_concerns: ['fine_lines', 'pores'],
        is_fragrance_free: true,
        rating: 4.8,
        instructions: 'Press the airtight pump once to dispense ideal dose. Apply to clean face day and night.'
    },
    {
        id: 112,
        category: 'skincare',
        tier: 'luxury',
        name: 'The Rich Cream with TFC8®',
        brand: 'Augustinus Bader',
        sub_type: 'Moisturizer',
        routine_time: 'Both',
        step_order: 3,
        price: 92.00,
        description: 'Pioneering cellular renewal cream backed by 30 years of stem cell science to intensely renew compromised skin.',
        key_actives: 'TFC8® (Trigger Factor Complex), Argan Oil, Avocado Oil',
        suitable_types: ['dry', 'sensitive'],
        targeted_concerns: ['dehydration', 'fine_lines', 'redness'],
        is_fragrance_free: true,
        rating: 4.9,
        instructions: 'In upward, sweeping motions, smooth two pumps over the face, neck and decollete.'
    },
    {
        id: 113,
        category: 'skincare',
        tier: 'luxury',
        name: 'Unseen Sunscreen Invisible Broad Spectrum SPF 40',
        brand: 'Supergoop!',
        sub_type: 'Sunscreen',
        routine_time: 'AM',
        step_order: 4,
        price: 38.00,
        description: '100% invisible, weightless, and scentless makeup-gripping sunscreen primer with a velvet matte finish.',
        key_actives: 'Red Algae, Frankincense, Meadowfoam Seed Complex',
        suitable_types: ['oily', 'dry', 'combination', 'sensitive', 'normal'],
        targeted_concerns: ['sun_protection'],
        is_fragrance_free: true,
        rating: 4.8,
        instructions: 'Apply generously and evenly as the last step in your skincare routine before makeup.'
    },

    // ------------------------------------------------------------------------
    // HAIR CARE - BUDGET-FRIENDLY ($)
    // ------------------------------------------------------------------------
    {
        id: 201,
        category: 'haircare',
        tier: 'budget',
        name: 'Elvive Total Repair 5 Repairing Shampoo',
        brand: 'L’Oréal Paris',
        sub_type: 'Shampoo',
        routine_time: 'Both',
        step_order: 1,
        price: 6.99,
        description: 'Drugstore champion infused with protein and ceramide to fight the 5 signs of damaged hair.',
        key_actives: 'Protein + Ceramide Recharge System',
        suitable_types: ['damaged_color', 'dry_frizz', 'normal_hair'],
        targeted_concerns: ['breakage', 'color_damage'],
        is_fragrance_free: false,
        rating: 4.7,
        instructions: 'Massage into wet hair, lather, and rinse thoroughly. Follow with conditioner.'
    },
    {
        id: 202,
        category: 'haircare',
        tier: 'budget',
        name: 'Fructis Sleek & Shine Frizz Control Conditioner',
        brand: 'Garnier',
        sub_type: 'Conditioner',
        routine_time: 'Both',
        step_order: 2,
        price: 6.49,
        description: 'Argan oil smoothing conditioner providing up to 72 hours of frizz control in high humidity.',
        key_actives: 'Sustainably Sourced Argan Oil, Active Fruit Proteins',
        suitable_types: ['dry_frizz', 'curly_coily'],
        targeted_concerns: ['frizz'],
        is_fragrance_free: false,
        rating: 4.7,
        instructions: 'After shampooing, apply conditioner from root to tip. Rinse after 2 minutes.'
    },
    {
        id: 203,
        category: 'haircare',
        tier: 'budget',
        name: 'Multi-Peptide Serum for Hair Density',
        brand: 'The Ordinary',
        sub_type: 'Hair Serum',
        routine_time: 'PM',
        step_order: 3,
        price: 14.90,
        description: 'Concentrated leave-in scalp serum formulated with advanced peptide technologies to support thicker, denser hair.',
        key_actives: 'REDENSYL™, Procapil™, CAPIXYL™, Baicapil™',
        suitable_types: ['oily_scalp', 'normal_hair'],
        targeted_concerns: ['thinning'],
        is_fragrance_free: true,
        rating: 4.8,
        instructions: 'Apply a few drops daily to clean, dry scalp once a day, ideally at bedtime.'
    },
    {
        id: 204,
        category: 'haircare',
        tier: 'budget',
        name: 'Rosemary Mint Scalp & Hair Strengthening Oil',
        brand: 'Mielle Organics',
        sub_type: 'Hair Serum / Scalp Oil',
        routine_time: 'Weekly',
        step_order: 1,
        price: 9.99,
        description: 'Viral nutrient-rich, intensive formula infused with biotin and over 30 essential oils for root nourishment.',
        key_actives: 'Rosemary Extract, Peppermint Oil, Biotin',
        suitable_types: ['curly_coily', 'dry_frizz', 'damaged_color'],
        targeted_concerns: ['thinning', 'breakage'],
        is_fragrance_free: false,
        rating: 4.8,
        instructions: 'Apply a small amount of oil to scalp, massage with fingers and comb through to ends of hair.'
    },
    {
        id: 205,
        category: 'haircare',
        tier: 'budget',
        name: '3 Minute Miracle Moist Deep Conditioning Treatment',
        brand: 'Aussie',
        sub_type: 'Deep Conditioner / Mask',
        routine_time: 'Weekly',
        step_order: 2,
        price: 5.99,
        description: 'Intense moisture mask that transforms parched, brittle strands into silky soft curls in 3 minutes.',
        key_actives: 'Australian Jojoba Oil, Sea Kelp Extract',
        suitable_types: ['dry_frizz', 'curly_coily'],
        targeted_concerns: ['frizz', 'breakage'],
        is_fragrance_free: false,
        rating: 4.8,
        instructions: 'Work into clean, wet hair, wait 3 minutes, then rinse.'
    },

    // ------------------------------------------------------------------------
    // HAIR CARE - EXPENSIVE / LUXURY ($$$)
    // ------------------------------------------------------------------------
    {
        id: 206,
        category: 'haircare',
        tier: 'luxury',
        name: 'No. 3 Hair Perfector Repairing Treatment',
        brand: 'Olaplex',
        sub_type: 'Bond Repair Treatment',
        routine_time: 'Weekly',
        step_order: 1,
        price: 30.00,
        description: 'Global benchmark bond builder that repairs broken disulfide bonds caused by heat, bleach, and coloring.',
        key_actives: 'Bis-Aminopropyl Diglycol Dimaleate (Patented Bond Multiplier)',
        suitable_types: ['damaged_color', 'dry_frizz', 'curly_coily'],
        targeted_concerns: ['color_damage', 'breakage'],
        is_fragrance_free: false,
        rating: 4.9,
        instructions: 'Apply to damp hair from roots to ends before shampooing. Leave on for 10+ minutes. Rinse and shampoo.'
    },
    {
        id: 207,
        category: 'haircare',
        tier: 'luxury',
        name: 'Nutritive Bain Satin Gentle Hydrating Shampoo',
        brand: 'Kérastase',
        sub_type: 'Luxury Shampoo',
        routine_time: 'Both',
        step_order: 1,
        price: 42.00,
        description: 'Prestige Parisian salon shampoo formulated with plant-based proteins and niacinamide to replenish dry fiber.',
        key_actives: 'Wheat, Corn & Soya Proteins, Niacinamide',
        suitable_types: ['dry_frizz', 'normal_hair'],
        targeted_concerns: ['frizz', 'breakage'],
        is_fragrance_free: false,
        rating: 4.9,
        instructions: 'Apply to wet hair, massage gently into scalp and lengths, emulsify and rinse thoroughly.'
    },
    {
        id: 208,
        category: 'haircare',
        tier: 'luxury',
        name: 'Don’t Despair, Repair!™ Deep Conditioning Mask',
        brand: 'Briogeo',
        sub_type: 'Deep Conditioner / Mask',
        routine_time: 'Weekly',
        step_order: 2,
        price: 39.00,
        description: 'Clinically proven clean mask that decreases breakage after two uses, restoring moisture balance and slip.',
        key_actives: 'Rosehip Oil, B-vitamins, Algae Extract, Sweet Almond',
        suitable_types: ['curly_coily', 'damaged_color', 'dry_frizz'],
        targeted_concerns: ['color_damage', 'frizz'],
        is_fragrance_free: true,
        rating: 4.9,
        instructions: 'After shampooing, massage into hair from mid-lengths to ends. Leave on for at least 10 minutes.'
    },
    {
        id: 209,
        category: 'haircare',
        tier: 'luxury',
        name: 'Gold Lust Nourishing Hair Oil',
        brand: 'Oribe',
        sub_type: 'Hair Serum / Oil',
        routine_time: 'Both',
        step_order: 3,
        price: 57.00,
        description: 'Ultra-luxurious lightweight liquid gold hair serum that absorbs instantly to restore, protect, and impart shine.',
        key_actives: 'Jasmine, Edelweiss Flower, Lychee, Sandalwood, Argan Extract',
        suitable_types: ['dry_frizz', 'damaged_color', 'normal_hair'],
        targeted_concerns: ['frizz', 'breakage'],
        is_fragrance_free: false,
        rating: 4.9,
        instructions: 'Apply throughout damp hair before blow drying or smooth through dry ends for high-gloss polish.'
    },
    {
        id: 210,
        category: 'haircare',
        tier: 'luxury',
        name: 'Hydrate Moisturizing Color-Safe Conditioner',
        brand: 'Pureology',
        sub_type: 'Conditioner',
        routine_time: 'Both',
        step_order: 2,
        price: 37.00,
        description: '100% vegan, concentrated sulfate-free conditioner with signature aromatherapy blend that preserves vibrant color.',
        key_actives: 'Jojoba, Green Tea, Sage, Antifade Complex®',
        suitable_types: ['damaged_color', 'dry_frizz'],
        targeted_concerns: ['color_damage'],
        is_fragrance_free: false,
        rating: 4.8,
        instructions: 'Apply a dime-sized amount to shampooed hair. Massage through lengths, leave for 1-2 minutes, rinse.'
    },

    // ------------------------------------------------------------------------
    // BODY CARE - BUDGET-FRIENDLY ($)
    // ------------------------------------------------------------------------
    {
        id: 301,
        category: 'bodycare',
        tier: 'budget',
        name: 'Deep Moisture Nourishing Body Wash',
        brand: 'Dove',
        sub_type: 'Body Wash / Cleanser',
        routine_time: 'Both',
        step_order: 1,
        price: 7.99,
        description: 'America’s #1 dermatologist-recommended body wash with Microbiome Nutrient Serum for 24-hour renewed softness.',
        key_actives: 'Microbiome Nutrient Serum, Plant-Based Moisturizers',
        suitable_types: ['normal_body', 'very_dry', 'sensitive_body'],
        targeted_concerns: ['extreme_dryness'],
        is_fragrance_free: false,
        rating: 4.8,
        instructions: 'Squeeze body wash onto a wet washcloth or sponge, massage into a creamy lather and rinse.'
    },
    {
        id: 302,
        category: 'bodycare',
        tier: 'budget',
        name: 'SA Body Wash for Rough & Bumpy Skin',
        brand: 'CeraVe',
        sub_type: 'Body Wash / Cleanser',
        routine_time: 'Both',
        step_order: 1,
        price: 13.99,
        description: 'Gentle salicylic acid chemical exfoliating body wash that smooths strawberry skin and keratosis pilaris bumps.',
        key_actives: 'Salicylic Acid, Urea, Niacinamide, 3 Essential Ceramides',
        suitable_types: ['bumpy_kp', 'normal_body'],
        targeted_concerns: ['rough_texture'],
        is_fragrance_free: true,
        rating: 4.9,
        instructions: 'Wet skin with lukewarm water. Massage body wash into skin in a gentle, circular motion. Rinse.'
    },
    {
        id: 303,
        category: 'bodycare',
        tier: 'budget',
        name: 'Daily Moisturizing Body Lotion',
        brand: 'Aveeno',
        sub_type: 'Body Lotion',
        routine_time: 'Both',
        step_order: 2,
        price: 11.49,
        description: 'Clinically proven soothing oat lotion that locks in 24-hour hydration and shields compromised dry skin barriers.',
        key_actives: 'Colloidal Oatmeal, Rich Emollients',
        suitable_types: ['very_dry', 'sensitive_body'],
        targeted_concerns: ['extreme_dryness'],
        is_fragrance_free: true,
        rating: 4.8,
        instructions: 'Smooth over entire body daily, especially after bathing while skin is still damp.'
    },
    {
        id: 304,
        category: 'bodycare',
        tier: 'budget',
        name: 'Roughness Relief Body Cream with Urea',
        brand: 'Eucerin',
        sub_type: 'Targeted Body Cream',
        routine_time: 'Both',
        step_order: 2,
        price: 13.29,
        description: 'Targeted smoothing body treatment with urea and natural moisturizing factors to gently soften stubborn rough patches.',
        key_actives: 'Urea, Ceramide 3, Natural Moisturizing Factors (NMF)',
        suitable_types: ['bumpy_kp', 'very_dry'],
        targeted_concerns: ['rough_texture', 'extreme_dryness'],
        is_fragrance_free: true,
        rating: 4.7,
        instructions: 'Smooth over rough, bumpy areas like the backs of arms and thighs daily.'
    },
    {
        id: 305,
        category: 'bodycare',
        tier: 'budget',
        name: 'Cocoa Radiant Nourishing Body Gel Oil',
        brand: 'Vaseline',
        sub_type: 'Body Oil',
        routine_time: 'PM',
        step_order: 3,
        price: 7.49,
        description: 'Glistening body gel oil crafted with pure cocoa butter that locks in vital moisture for a warm, radiant satin glow.',
        key_actives: 'Pure Cocoa Butter, Micro-Droplets of Vaseline Jelly',
        suitable_types: ['very_dry', 'normal_body'],
        targeted_concerns: ['loss_of_elasticity', 'extreme_dryness'],
        is_fragrance_free: false,
        rating: 4.8,
        instructions: 'Apply a few drops after showering to lock in moisture and impart instant radiance.'
    },

    // ------------------------------------------------------------------------
    // BODY CARE - EXPENSIVE / LUXURY ($$$)
    // ------------------------------------------------------------------------
    {
        id: 306,
        category: 'bodycare',
        tier: 'luxury',
        name: 'The Body Wash (Eucalyptus)',
        brand: 'Nécessaire',
        sub_type: 'Body Wash / Cleanser',
        routine_time: 'Both',
        step_order: 1,
        price: 28.00,
        description: 'Multi-vitamin daily body gel cleanser with niacinamide and botanical oils that balances and softens skin.',
        key_actives: 'Niacinamide (Vitamin B3), Vitamin C, Vitamin E, Omega-6, Omega-9',
        suitable_types: ['normal_body', 'sensitive_body', 'very_dry'],
        targeted_concerns: ['extreme_dryness'],
        is_fragrance_free: false,
        rating: 4.9,
        instructions: 'Apply all over body. Massage for rich, pillowy foam. Rinse well.'
    },
    {
        id: 307,
        category: 'bodycare',
        tier: 'luxury',
        name: 'Brazilian Bum Bum Cream',
        brand: 'Sol de Janeiro',
        sub_type: 'Body Cream',
        routine_time: 'Both',
        step_order: 2,
        price: 48.00,
        description: 'Cult-favorite award-winning body cream infused with caffeine-rich Guaraná extract to visibly firm and smooth skin.',
        key_actives: 'Guaraná Extract, Cupuaçu Butter, Açaí Oil, Coconut Oil',
        suitable_types: ['normal_body', 'very_dry'],
        targeted_concerns: ['loss_of_elasticity'],
        is_fragrance_free: false,
        rating: 4.9,
        instructions: 'Massage in a circular motion to create warmth for better absorption and circulation.'
    },
    {
        id: 308,
        category: 'bodycare',
        tier: 'luxury',
        name: 'St. Barts Scalp & Body Exfoliating Scrub',
        brand: 'OUAI',
        sub_type: 'Body Polish / Exfoliator',
        routine_time: 'Weekly',
        step_order: 1,
        price: 40.00,
        description: 'Sugar crystal body polish with coconut oil that gently sweeps away dry flakes while transporting you to the tropics.',
        key_actives: 'Sugar Crystals, Coconut Oil, Probiotics',
        suitable_types: ['bumpy_kp', 'normal_body'],
        targeted_concerns: ['rough_texture'],
        is_fragrance_free: false,
        rating: 4.8,
        instructions: 'In the shower, massage in circular motions across limbs. Rinse clean.'
    },
    {
        id: 309,
        category: 'bodycare',
        tier: 'luxury',
        name: 'Almond Supple Skin Firming Body Oil',
        brand: 'L’Occitane',
        sub_type: 'Body Oil',
        routine_time: 'PM',
        step_order: 3,
        price: 54.00,
        description: 'Formulated with more than 50% sweet almond oil to deliver 48 hours of intense hydration and prevent stretch marks.',
        key_actives: 'Sweet Almond Oil, Camelina Oil, Omega 3-6-9',
        suitable_types: ['very_dry', 'normal_body'],
        targeted_concerns: ['loss_of_elasticity', 'extreme_dryness'],
        is_fragrance_free: false,
        rating: 4.9,
        instructions: 'Spray all over body and massage into skin using upward circular motions.'
    },

    // ------------------------------------------------------------------------
    // LIP CARE - BUDGET-FRIENDLY ($)
    // ------------------------------------------------------------------------
    {
        id: 401,
        category: 'lipcare',
        tier: 'budget',
        name: 'Lip Repair Immediate Relief Balm',
        brand: 'Aquaphor',
        sub_type: 'Lip Balm',
        routine_time: 'Both',
        step_order: 1,
        price: 4.99,
        description: '#1 dermatologist-recommended lip care brand that soothes severely chapped, cracked lips immediately.',
        key_actives: 'Shea Butter, Chamomile Essence, Vitamins C & E',
        suitable_types: ['chapped', 'dry_lips', 'sensitive_lips'],
        targeted_concerns: ['peeling'],
        is_fragrance_free: true,
        rating: 4.9,
        instructions: 'Apply to lips as needed. Safe for daily continuous wear.'
    },
    {
        id: 402,
        category: 'lipcare',
        tier: 'budget',
        name: 'Lip Therapy Rosy Lips',
        brand: 'Vaseline',
        sub_type: 'Lip Balm',
        routine_time: 'Both',
        step_order: 1,
        price: 2.99,
        description: 'Made with triple-purified petroleum jelly and soft rose oil to seal in moisture and add a sheer rosy glow.',
        key_actives: 'Triple-Purified Petroleum Jelly, Rose Oil',
        suitable_types: ['dry_lips', 'normal_lips'],
        targeted_concerns: ['thinness'],
        is_fragrance_free: false,
        rating: 4.7,
        instructions: 'Dip finger into jar and spread evenly over lips.'
    },
    {
        id: 403,
        category: 'lipcare',
        tier: 'budget',
        name: 'Tripeptide Plumping Lip Balm',
        brand: 'The INKEY List',
        sub_type: 'Lip Plumper',
        routine_time: 'Both',
        step_order: 2,
        price: 9.99,
        description: 'Clinically proven non-sticky lip balm that visibly increases lip volume up to 40% in 4 weeks.',
        key_actives: 'Tripeptide Complex, Ultra Filling Spheres, Mango Seed Butter',
        suitable_types: ['normal_lips', 'dry_lips'],
        targeted_concerns: ['thinness', 'fine_lines'],
        is_fragrance_free: true,
        rating: 4.8,
        instructions: 'Apply onto clean, dry lips at least 3 times a day for cumulative plumping results.'
    },

    // ------------------------------------------------------------------------
    // LIP CARE - EXPENSIVE / LUXURY ($$$)
    // ------------------------------------------------------------------------
    {
        id: 404,
        category: 'lipcare',
        tier: 'luxury',
        name: 'Lip Sleeping Mask (Berry)',
        brand: 'LANEIGE',
        sub_type: 'Lip Mask',
        routine_time: 'PM',
        step_order: 1,
        price: 24.00,
        description: 'Iconic global bestseller that melts dead skin cells off lips overnight with Berry Fruit Complex and Vitamin C.',
        key_actives: 'Berry Fruit Complex™, Vitamin C, Murumuru & Shea Seed Butter',
        suitable_types: ['chapped', 'dry_lips', 'pigmented_lips'],
        targeted_concerns: ['peeling', 'fine_lines'],
        is_fragrance_free: false,
        rating: 4.9,
        instructions: 'Apply generously to lips in the evening and leave on overnight. Gently wipe clean in morning.'
    },
    {
        id: 405,
        category: 'lipcare',
        tier: 'luxury',
        name: 'Peptide Lip Treatment',
        brand: 'Rhode',
        sub_type: 'Lip Treatment',
        routine_time: 'Both',
        step_order: 1,
        price: 20.00,
        description: 'A restorative lip treatment for naturally plump, pillowy-soft lips with a glossy, glazed finish.',
        key_actives: 'Peptides, Shea Butter, Cupuaçu, Babassu',
        suitable_types: ['chapped', 'dry_lips', 'normal_lips'],
        targeted_concerns: ['peeling', 'thinness'],
        is_fragrance_free: true,
        rating: 4.9,
        instructions: 'Glaze onto lips day or night for soft, nourished volume.'
    },
    {
        id: 406,
        category: 'lipcare',
        tier: 'luxury',
        name: 'Dior Addict Lip Glow Oil',
        brand: 'Dior',
        sub_type: 'Lip Oil / Plumper',
        routine_time: 'Both',
        step_order: 2,
        price: 40.00,
        description: 'Nourishing cherry oil lip gloss that adapts to your natural lip color while deeply protecting against stress.',
        key_actives: 'Cherry Oil, Color Reviver Technology',
        suitable_types: ['normal_lips', 'pigmented_lips'],
        targeted_concerns: ['thinness'],
        is_fragrance_free: false,
        rating: 4.9,
        instructions: 'Wear on its own, as a primer under lipstick, or as a top coat for dazzling volume.'
    },

    // ------------------------------------------------------------------------
    // EYE CARE - BUDGET-FRIENDLY ($)
    // ------------------------------------------------------------------------
    {
        id: 501,
        category: 'eyecare',
        tier: 'budget',
        name: 'Caffeine Solution 5% + EGCG',
        brand: 'The Ordinary',
        sub_type: 'Eye Serum',
        routine_time: 'AM',
        step_order: 1,
        price: 8.90,
        description: 'Cult-favorite concentrated eye serum with 5% caffeine and green tea EGCG to rapidly drain puffiness and shadows.',
        key_actives: 'Caffeine 5%, Epigallocatechin Gallatyl Glucoside (EGCG)',
        suitable_types: ['puffiness', 'dark_circles'],
        targeted_concerns: ['morning_puffiness', 'vascular_shadows'],
        is_fragrance_free: true,
        rating: 4.8,
        instructions: 'Massage a small amount onto the eye contour morning and evening.'
    },
    {
        id: 502,
        category: 'eyecare',
        tier: 'budget',
        name: 'Caffeine De-Puffing Eye Cream',
        brand: 'The INKEY List',
        sub_type: 'Eye Cream',
        routine_time: 'Both',
        step_order: 2,
        price: 10.99,
        description: 'Hydrating, lightweight eye cream that reduces under-eye bags and fine lines with Matrixyl 3000 peptides.',
        key_actives: 'Caffeine, Matrixyl 3000 Peptide Complex',
        suitable_types: ['puffiness', 'dark_circles', 'fine_lines_eye'],
        targeted_concerns: ['morning_puffiness'],
        is_fragrance_free: true,
        rating: 4.7,
        instructions: 'Pat a pine nut-sized amount under the eye using your ring finger.'
    },
    {
        id: 503,
        category: 'eyecare',
        tier: 'budget',
        name: 'Eye Repair Cream for Dark Circles',
        brand: 'CeraVe',
        sub_type: 'Eye Cream',
        routine_time: 'Both',
        step_order: 2,
        price: 14.49,
        description: 'Ophthalmologist-tested restorative eye cream featuring 3 essential ceramides and marine botanical complex.',
        key_actives: 'Ceramides 1, 3, 6-II, Marine & Botanical Complex, Niacinamide',
        suitable_types: ['dry_crepey', 'sensitive_eyes', 'dark_circles'],
        targeted_concerns: ['thin_skin', 'vascular_shadows'],
        is_fragrance_free: true,
        rating: 4.8,
        instructions: 'Apply in small dots around the eye area and gently smooth until thoroughly absorbed.'
    },

    // ------------------------------------------------------------------------
    // EYE CARE - EXPENSIVE / LUXURY ($$$)
    // ------------------------------------------------------------------------
    {
        id: 504,
        category: 'eyecare',
        tier: 'luxury',
        name: 'Advanced Night Repair Eye Supercharged Gel-Creme',
        brand: 'Estée Lauder',
        sub_type: 'Eye Gel-Cream',
        routine_time: 'Both',
        step_order: 2,
        price: 72.00,
        description: 'Luxury prestige eye gel-cream proven to brighten dark circles in just 2 weeks and protect from blue light damage.',
        key_actives: 'Chronolux™ Power Signal Technology, Multi-Weight Hyaluronic Acid, Vitamin E',
        suitable_types: ['dark_circles', 'fine_lines_eye'],
        targeted_concerns: ['vascular_shadows', 'eyelid_laxity'],
        is_fragrance_free: true,
        rating: 4.9,
        instructions: 'Apply AM and PM all around eye area using gentle tapping motions.'
    },
    {
        id: 505,
        category: 'eyecare',
        tier: 'luxury',
        name: 'Auto Correct Brightening and Depuffing Eye Cream',
        brand: 'Sunday Riley',
        sub_type: 'Eye Cream',
        routine_time: 'AM',
        step_order: 1,
        price: 65.00,
        description: 'Prestige instant awakening eye cream infused with caffeine and Brazilian ginseng to immediately banish tired eye bags.',
        key_actives: 'Caffeine, Brazilian Ginseng Root, Horse Chestnut, Lutein',
        suitable_types: ['puffiness', 'dark_circles'],
        targeted_concerns: ['morning_puffiness', 'vascular_shadows'],
        is_fragrance_free: true,
        rating: 4.8,
        instructions: 'Apply 2-3 pumps morning and evening, tapping gently with your ring finger.'
    },
    {
        id: 506,
        category: 'eyecare',
        tier: 'luxury',
        name: 'Creamy Eye Treatment with Avocado',
        brand: 'Kiehl’s',
        sub_type: 'Rich Eye Butter',
        routine_time: 'Both',
        step_order: 2,
        price: 55.00,
        description: 'Best-selling rich, creamy avocado oil treatment that provides all-day hydration without migrating into eyes.',
        key_actives: 'Avocado Oil, Beta-Carotene, Shea Butter',
        suitable_types: ['dry_crepey', 'sensitive_eyes'],
        targeted_concerns: ['thin_skin'],
        is_fragrance_free: true,
        rating: 4.9,
        instructions: 'Warm between fingers until texture transforms from cream to water before gently tapping into eye contour.'
    }
];

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    loadSavedState();
    setupDashboardFlow();
    setupAuthListeners();
    setupRoutineModal();

    // Default to Dashboard 1 (Login Page) if not logged in
    if (!state.isLoggedIn) {
        navigateToStep(1);
    } else {
        navigateToStep(2);
    }
});

// Load State from LocalStorage
function loadSavedState() {
    const savedUser = localStorage.getItem('aura_flow_user');
    if (savedUser) {
        try {
            state.user = JSON.parse(savedUser);
            state.isLoggedIn = true;
        } catch (e) {}
    }

    const savedRoutine = localStorage.getItem('aura_flow_routine');
    if (savedRoutine) {
        try { state.savedRoutine = JSON.parse(savedRoutine); } catch (e) {}
    }

    updateHeaderUserInfo();
    updateRoutineBadgeCount();
}

function persistState() {
    if (state.isLoggedIn) {
        localStorage.setItem('aura_flow_user', JSON.stringify(state.user));
    } else {
        localStorage.removeItem('aura_flow_user');
    }
    localStorage.setItem('aura_flow_routine', JSON.stringify(state.savedRoutine));
}

// ============================================================================
// NAVIGATION & STEP CONTROLLER (1: Login -> 2: Category -> 3: Type -> 4: Recs)
// ============================================================================

function navigateToStep(stepNumber) {
    state.currentStep = stepNumber;

    // Toggle active dashboard pages
    document.querySelectorAll('.dashboard-page').forEach((page, idx) => {
        page.classList.toggle('active', (idx + 1) === stepNumber);
    });

    // Update Stepper in header
    for (let i = 1; i <= 4; i++) {
        const node = document.getElementById(`step-node-${i}`);
        const line = document.getElementById(`step-line-${i}`);
        if (node) {
            node.classList.toggle('active', i === stepNumber);
            node.classList.toggle('completed', i < stepNumber);
        }
        if (line) {
            line.classList.toggle('active', i < stepNumber);
        }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (stepNumber === 2) {
        updateHeaderUserInfo();
    } else if (stepNumber === 3) {
        renderTypeSelectionDashboard();
    } else if (stepNumber === 4) {
        renderRecommendationsDashboard();
    }
}

function setupDashboardFlow() {
    document.getElementById('brand-logo-btn').addEventListener('click', () => {
        if (state.isLoggedIn) {
            navigateToStep(2);
        } else {
            navigateToStep(1);
        }
    });

    // Dashboard 2: Category Selection Cards
    document.querySelectorAll('.category-selection-card').forEach(card => {
        card.addEventListener('click', () => {
            const cat = card.getAttribute('data-category');
            selectCategory(cat);
        });
    });

    // Dashboard 3: Back to categories
    document.getElementById('back-to-categories-btn').addEventListener('click', () => {
        navigateToStep(2);
    });

    // Dashboard 3: Generate recommendations
    document.getElementById('generate-recommendations-btn').addEventListener('click', () => {
        navigateToStep(4);
    });

    // Dashboard 4: Change Type & Change Category buttons
    document.getElementById('change-type-btn').addEventListener('click', () => {
        navigateToStep(3);
    });
    document.getElementById('change-cat-btn').addEventListener('click', () => {
        navigateToStep(2);
    });

    // Dashboard 4: View Routine from banner
    document.getElementById('view-routine-from-rec-btn').addEventListener('click', () => {
        openRoutineModal();
    });

    // Dashboard 4: Price Tier filter pills (Budget-Friendly vs Expensive)
    document.querySelectorAll('#rec-tier-filters .tier-filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('#rec-tier-filters .tier-filter-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            state.priceTierFilter = pill.getAttribute('data-tier');
            renderProductGrid();
            showToast(`Filtered: ${pill.textContent}`);
        });
    });

    // Dashboard 4: Recommendation step/time filter pills
    document.querySelectorAll('#rec-step-filters .rec-filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('#rec-step-filters .rec-filter-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            state.recFilter = pill.getAttribute('data-filter');
            renderProductGrid();
        });
    });
}

function selectCategory(categoryKey) {
    state.selectedCategory = categoryKey;
    // Set smart default type for category
    if (categoryKey === 'skincare') state.selectedType = 'oily';
    else if (categoryKey === 'haircare') state.selectedType = 'dry_frizz';
    else if (categoryKey === 'bodycare') state.selectedType = 'very_dry';
    else if (categoryKey === 'lipcare') state.selectedType = 'chapped';
    else if (categoryKey === 'eyecare') state.selectedType = 'dark_circles';

    state.selectedConcerns = [];
    navigateToStep(3);
}

// ============================================================================
// DASHBOARD 1: AUTH & LOGIN HANDLERS
// ============================================================================

function setupAuthListeners() {
    const tabLogin = document.getElementById('tab-login-btn');
    const tabReg = document.getElementById('tab-register-btn');
    const loginForm = document.getElementById('login-form');
    const regForm = document.getElementById('register-form');
    const guestBtn = document.getElementById('guest-login-btn');
    const logoutBtn = document.getElementById('logout-btn');

    tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabReg.classList.remove('active');
        loginForm.classList.add('active');
        regForm.classList.remove('active');
    });

    tabReg.addEventListener('click', () => {
        tabReg.classList.add('active');
        tabLogin.classList.remove('active');
        regForm.classList.add('active');
        loginForm.classList.remove('active');
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim() || 'beauty_explorer';
        handleSuccessfulLogin({
            id: Date.now(),
            username: username,
            full_name: username.replace(/_/g, ' '),
            email: `${username}@example.com`
        });
    });

    regForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const fullName = document.getElementById('reg-fullname').value.trim();
        const username = document.getElementById('reg-username').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        handleSuccessfulLogin({
            id: Date.now(),
            username: username,
            full_name: fullName,
            email: email
        });
    });

    guestBtn.addEventListener('click', () => {
        handleSuccessfulLogin({
            id: 1,
            username: 'guest_explorer',
            full_name: 'Guest Explorer',
            email: 'guest@aurabeauty.internal'
        });
    });

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            state.isLoggedIn = false;
            state.user = { id: null, username: '', full_name: '', email: '' };
            persistState();
            updateHeaderUserInfo();
            showToast('Signed out successfully.');
            navigateToStep(1);
        });
    }
}

function handleSuccessfulLogin(userData) {
    state.isLoggedIn = true;
    state.user = userData;
    persistState();
    updateHeaderUserInfo();
    showToast(`Welcome, ${userData.full_name}! Choose a category next.`);
    navigateToStep(2);
}

function updateHeaderUserInfo() {
    const badge = document.getElementById('user-badge-btn');
    const routineBtn = document.getElementById('open-routine-btn');
    const nameEl = document.getElementById('user-display-name');
    const avatarEl = document.getElementById('user-avatar-initial');

    if (state.isLoggedIn) {
        if (badge) badge.style.display = 'flex';
        if (routineBtn) routineBtn.style.display = 'flex';
        if (nameEl) nameEl.textContent = state.user.full_name || state.user.username;
        if (avatarEl) {
            const initial = (state.user.full_name || state.user.username || 'U').charAt(0).toUpperCase();
            avatarEl.textContent = initial;
        }
    } else {
        if (badge) badge.style.display = 'none';
        if (routineBtn) routineBtn.style.display = 'none';
    }
}

// ============================================================================
// DASHBOARD 3: TYPE SELECTION (DRY, OILY, COMBINATION, ETC.)
// ============================================================================

function renderTypeSelectionDashboard() {
    const config = categoryTypeDefinitions[state.selectedCategory];
    if (!config) return;

    // Header labels
    document.getElementById('type-category-pill').textContent = `${capitalize(state.selectedCategory)} Selected`;
    document.getElementById('type-page-title').textContent = config.title;
    document.getElementById('type-page-desc').textContent = config.desc;

    // Render Type Cards
    const gridEl = document.getElementById('types-cards-grid');
    gridEl.innerHTML = '';

    config.types.forEach(t => {
        const isSelected = t.id === state.selectedType;
        const card = document.createElement('div');
        card.className = `type-card ${isSelected ? 'selected' : ''}`;
        card.setAttribute('data-type-id', t.id);
        card.innerHTML = `
            <div class="type-card-top">
                <span class="type-card-emoji">${t.emoji}</span>
                <h3 class="type-card-title">${t.title}</h3>
                <p class="type-card-desc">${t.desc}</p>
            </div>
            <div class="type-card-select-ind">
                ${isSelected ? 'Selected' : 'Select'}
            </div>
        `;

        card.addEventListener('click', () => {
            state.selectedType = t.id;
            document.querySelectorAll('.type-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            document.querySelectorAll('.type-card-select-ind').forEach(ind => ind.textContent = 'Select');
            card.querySelector('.type-card-select-ind').textContent = 'Selected';
            showToast(`Selected: ${t.title}`);
        });

        gridEl.appendChild(card);
    });

    // Render Concerns
    const concernsWrap = document.getElementById('concerns-chips-wrap');
    concernsWrap.innerHTML = '';

    config.concerns.forEach(c => {
        const isActive = state.selectedConcerns.includes(c.id);
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = `concern-chip ${isActive ? 'active' : ''}`;
        chip.textContent = c.label;

        chip.addEventListener('click', () => {
            chip.classList.toggle('active');
            if (chip.classList.contains('active')) {
                if (!state.selectedConcerns.includes(c.id)) state.selectedConcerns.push(c.id);
            } else {
                state.selectedConcerns = state.selectedConcerns.filter(item => item !== c.id);
            }
        });

        concernsWrap.appendChild(chip);
    });
}

// ============================================================================
// DASHBOARD 4: RECOMMENDATIONS & WHAT NOT TO USE ENGINE
// ============================================================================

function getScoredRecommendations() {
    const cat = state.selectedCategory;
    const userType = state.selectedType;
    const userConcerns = state.selectedConcerns;
    const tierFilter = state.priceTierFilter;

    return masterProducts
        .filter(prod => {
            if (prod.category !== cat) return false;
            if (tierFilter !== 'all' && prod.tier !== tierFilter) return false;
            return true;
        })
        .map(prod => {
            let baseScore = 75;
            const reasons = [];

            // Primary Type Match (+18%)
            if (prod.suitable_types.includes(userType)) {
                baseScore += 18;
                reasons.push(`Precisely formulated for ${formatTypeName(userType)}`);
            } else {
                baseScore -= 10;
            }

            // Secondary Concerns Match (+5% each)
            const matchedConcerns = (userConcerns || []).filter(c => prod.targeted_concerns.includes(c));
            if (matchedConcerns.length > 0) {
                baseScore += matchedConcerns.length * 5;
                reasons.push(`Directly targets ${matchedConcerns.map(capitalize).join(', ')}`);
            }

            // Clean formula bonus
            if (prod.is_fragrance_free) {
                baseScore += 4;
                reasons.push('100% Fragrance-free barrier-safe formula');
            }

            const compatibility_score = Math.min(99, Math.max(62, baseScore));
            return {
                ...prod,
                compatibility_score,
                reasons: reasons.length ? reasons : ['Balances everyday cellular hydration']
            };
        })
        .sort((a, b) => {
            if (a.step_order !== b.step_order) return a.step_order - b.step_order;
            return b.compatibility_score - a.compatibility_score;
        });
}

function renderRecommendationsDashboard() {
    const typeObj = categoryTypeDefinitions[state.selectedCategory]?.types.find(t => t.id === state.selectedType);
    const typeTitle = typeObj ? typeObj.title : capitalize(state.selectedType);

    // Banner summary text
    document.getElementById('rec-banner-title').textContent = `${capitalize(state.selectedCategory)} for ${typeTitle}`;
    document.getElementById('rec-banner-sub').textContent = 
        `Custom brand formulations matching your ${typeTitle.toLowerCase()} profile.`;

    // Render What NOT to Use (Avoidance Guide)
    renderAvoidanceSection();

    // Render Recommended Products
    renderProductGrid();
}

// Render "What NOT to Use" Contraindications Card
function renderAvoidanceSection() {
    const avoidContainer = document.getElementById('rec-avoid-section');
    if (!avoidContainer) return;

    const cat = state.selectedCategory;
    const currentType = state.selectedType;
    const avoidList = avoidanceDatabase[cat]?.[currentType] || [];

    if (avoidList.length === 0) {
        avoidContainer.innerHTML = '';
        return;
    }

    avoidContainer.innerHTML = `
        <div class="avoidance-card-main">
            <div class="avoidance-header">
                <span class="avoidance-icon">⚠️</span>
                <div>
                    <h3 class="avoidance-title">What NOT to Use in Your Daily Routine</h3>
                    <p class="avoidance-subtitle">Products, harsh ingredients, and habits contraindicated for your <strong>${formatTypeName(currentType)}</strong> profile.</p>
                </div>
            </div>
            <div class="avoidance-items-grid">
                ${avoidList.map(item => `
                    <div class="avoid-item-card">
                        <div class="avoid-item-top">
                            <span class="avoid-badge">🚫 AVOID THIS</span>
                            <h4 class="avoid-item-name">${item.name}</h4>
                            <p class="avoid-item-reason">${item.reason}</p>
                        </div>
                        <div class="avoid-item-swap">
                            <span>Use Instead: ${item.swap}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderProductGrid() {
    const gridEl = document.getElementById('rec-products-grid');
    const countInfo = document.getElementById('rec-count-info');
    let items = getScoredRecommendations();

    // Apply Time filter (AM / PM / All)
    if (state.recFilter === 'AM') {
        items = items.filter(i => i.routine_time === 'AM' || i.routine_time === 'Both');
    } else if (state.recFilter === 'PM') {
        items = items.filter(i => i.routine_time === 'PM' || i.routine_time === 'Both');
    }

    const tierName = state.priceTierFilter === 'budget' ? 'Budget-Friendly ($ · ₹)' : (state.priceTierFilter === 'luxury' ? 'Luxury / Expensive ($$$ · ₹₹₹)' : 'All Price Tiers ($ & ₹)');
    if (countInfo) countInfo.textContent = `Showing ${items.length} curated product${items.length === 1 ? '' : 's'} (${tierName})`;

    gridEl.innerHTML = '';

    if (items.length === 0) {
        gridEl.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; color: var(--color-text-muted);">
                <p>No products match the selected tier and step filter. Try clicking 'All Tiers' or 'All Steps'.</p>
            </div>
        `;
        return;
    }

    items.forEach(prod => {
        const inRoutine = state.savedRoutine.some(r => r.productId === prod.id);
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-card-top">
                <div class="product-badges-row">
                    <span class="step-order-badge">Step ${prod.step_order} · ${prod.sub_type}</span>
                    <span class="product-tier-badge ${prod.tier}">
                        ${prod.tier === 'budget' ? '🪙 Budget-Friendly' : '💎 Luxury Tier'} · $${prod.price.toFixed(2)} (₹${formatINR(prod.price)})
                    </span>
                    <span class="match-score-badge">✦ ${prod.compatibility_score}% Match</span>
                </div>
                <div class="product-brand">${prod.brand}</div>
                <h3 class="product-name" data-id="${prod.id}">${prod.name}</h3>
                <p class="product-desc">${prod.description}</p>
                <div class="product-actives-box">
                    <span class="actives-label">Key Bio-Actives</span>
                    <span class="actives-list">${prod.key_actives}</span>
                </div>
                <ul class="product-reasons-list">
                    ${prod.reasons.map(r => `<li>${r}</li>`).join('')}
                </ul>
            </div>
            <div class="product-card-bottom">
                <span class="product-price">$${prod.price.toFixed(2)} <span class="price-inr">(₹${formatINR(prod.price)})</span></span>
                <div class="product-actions-btn-group">
                    <button class="btn-details" data-id="${prod.id}">Details</button>
                    <button class="btn-add-routine ${inRoutine ? 'in-routine' : ''}" data-id="${prod.id}">
                        ${inRoutine ? '✓ In Routine' : '+ Add to Routine'}
                    </button>
                </div>
            </div>
        `;

        card.querySelector('.product-name').addEventListener('click', () => openProductDetailModal(prod));
        card.querySelector('.btn-details').addEventListener('click', () => openProductDetailModal(prod));
        card.querySelector('.btn-add-routine').addEventListener('click', (e) => {
            toggleRoutineItem(prod, e.target);
        });

        gridEl.appendChild(card);
    });
}

// ============================================================================
// ROUTINE MODAL & TRACKER
// ============================================================================

function setupRoutineModal() {
    const routineBtn = document.getElementById('open-routine-btn');
    const routineModal = document.getElementById('routine-modal');
    const closeBtn = document.getElementById('close-routine-modal-btn');
    const resetBtn = document.getElementById('reset-daily-steps-btn');

    if (routineBtn) {
        routineBtn.addEventListener('click', openRoutineModal);
    }
    if (closeBtn) {
        closeBtn.addEventListener('click', closeRoutineModal);
    }
    if (routineModal) {
        routineModal.addEventListener('click', (e) => {
            if (e.target === routineModal) closeRoutineModal();
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            state.savedRoutine.forEach(r => r.completed = false);
            persistState();
            renderRoutineModalLists();
            showToast('All checklist steps reset for today!');
        });
    }
}

function openRoutineModal() {
    const modal = document.getElementById('routine-modal');
    if (modal) {
        renderRoutineModalLists();
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    }
}

function closeRoutineModal() {
    const modal = document.getElementById('routine-modal');
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }
}

function renderRoutineModalLists() {
    const amList = document.getElementById('routine-modal-am-list');
    const pmList = document.getElementById('routine-modal-pm-list');

    const amItems = state.savedRoutine.filter(r => r.routine_time === 'AM' || r.routine_time === 'Both');
    const pmItems = state.savedRoutine.filter(r => r.routine_time === 'PM' || r.routine_time === 'Both');

    const renderList = (items, container, slotName) => {
        container.innerHTML = '';
        if (items.length === 0) {
            container.innerHTML = `<p style="font-size: 0.85rem; color: var(--color-text-muted); padding: 10px 0;">No ${slotName} products added yet.</p>`;
            return;
        }

        items.forEach((item, idx) => {
            const row = document.createElement('div');
            row.className = `routine-row-item ${item.completed ? 'completed' : ''}`;
            row.innerHTML = `
                <div class="routine-check ${item.completed ? 'checked' : ''}">
                    ${item.completed ? '✓' : ''}
                </div>
                <div class="item-info">
                    <span class="item-step">Step ${idx + 1}</span>
                    <h4 class="item-name">${item.name}</h4>
                    <span class="item-brand">${item.brand}${item.price ? ` · $${item.price.toFixed(2)} (₹${formatINR(item.price)})` : ''}</span>
                </div>
            `;

            row.querySelector('.routine-check').addEventListener('click', () => {
                item.completed = !item.completed;
                persistState();
                renderRoutineModalLists();
                showToast(item.completed ? `Done: ${item.name}` : `Incomplete: ${item.name}`);
            });

            container.appendChild(row);
        });
    };

    renderList(amItems, amList, 'Morning');
    renderList(pmItems, pmList, 'Evening');
}

function toggleRoutineItem(prod, btnEl) {
    const existingIndex = state.savedRoutine.findIndex(r => r.productId === prod.id);
    if (existingIndex > -1) {
        state.savedRoutine.splice(existingIndex, 1);
        btnEl.classList.remove('in-routine');
        btnEl.textContent = '+ Add to Routine';
        showToast(`Removed ${prod.name} from routine.`);
    } else {
        state.savedRoutine.push({
            id: Date.now(),
            productId: prod.id,
            name: prod.name,
            brand: prod.brand,
            routine_time: prod.routine_time,
            step_order: prod.step_order,
            price: prod.price,
            completed: false
        });
        btnEl.classList.add('in-routine');
        btnEl.textContent = '✓ In Routine';
        showToast(`Added ${prod.name} to daily regimen ✨`);
    }

    persistState();
    updateRoutineBadgeCount();
}

function updateRoutineBadgeCount() {
    const badge = document.getElementById('routine-count-badge');
    if (badge) badge.textContent = state.savedRoutine.length;
}

// ============================================================================
// PRODUCT DETAIL MODAL
// ============================================================================

function openProductDetailModal(prod) {
    const modal = document.getElementById('product-modal');
    const content = document.getElementById('product-modal-content');
    if (!modal || !content) return;

    content.innerHTML = `
        <span style="font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--color-text-subtle);">${prod.brand}</span>
        <h2 style="font-family: var(--font-heading); font-size: 1.7rem; color: var(--color-text-main); margin: 4px 0 12px;">${prod.name}</h2>
        <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap;">
            <span class="step-order-badge">Step ${prod.step_order} · ${prod.sub_type}</span>
            <span class="product-tier-badge ${prod.tier}">
                ${prod.tier === 'budget' ? '🪙 Budget-Friendly' : '💎 Luxury Tier'} · $${prod.price.toFixed(2)} (₹${formatINR(prod.price)})
            </span>
            <span class="match-score-badge">✦ ${prod.compatibility_score || 95}% Match</span>
            <span class="step-order-badge">${prod.is_fragrance_free ? 'Fragrance-Free' : 'Botanical'}</span>
        </div>
        <p style="font-size: 0.92rem; color: var(--color-text-muted); line-height: 1.55; margin-bottom: 20px;">${prod.description}</p>
        
        <div style="background: var(--color-primary-light); padding: 14px 16px; border-radius: var(--radius-sm); margin-bottom: 16px; border-left: 3px solid var(--color-primary);">
            <strong style="display: block; font-size: 0.75rem; text-transform: uppercase; color: var(--color-primary-dark); margin-bottom: 4px;">Key Active Ingredients</strong>
            <span style="font-size: 0.88rem; font-weight: 600; color: var(--color-text-main);">${prod.key_actives}</span>
        </div>

        <div style="background: #FAF7F2; padding: 14px 16px; border-radius: var(--radius-sm); margin-bottom: 24px; border-left: 3px solid var(--color-accent-sage);">
            <strong style="display: block; font-size: 0.75rem; text-transform: uppercase; color: var(--color-accent-sage); margin-bottom: 4px;">How To Apply in Routine</strong>
            <span style="font-size: 0.88rem; color: var(--color-text-main);">${prod.instructions}</span>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-border); padding-top: 16px; flex-wrap: wrap; gap: 10px;">
            <span style="font-size: 1.4rem; font-weight: 700; font-family: var(--font-heading); display: inline-flex; align-items: center; gap: 6px;">
                $${prod.price.toFixed(2)}
                <span style="font-size: 1.05rem; font-family: var(--font-sans); font-weight: 600; color: var(--color-primary-dark); background: rgba(184, 115, 82, 0.12); padding: 2px 8px; border-radius: 6px;">
                    (₹${formatINR(prod.price)})
                </span>
            </span>
            <button class="btn btn-primary" id="modal-add-routine-btn">Add to Daily Routine</button>
        </div>
    `;

    content.querySelector('#modal-add-routine-btn').addEventListener('click', () => {
        toggleRoutineItem(prod, content.querySelector('#modal-add-routine-btn'));
        closeProductDetailModal();
        renderProductGrid();
    });

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
}

function closeProductDetailModal() {
    const modal = document.getElementById('product-modal');
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }
}

const closeDetailBtn = document.getElementById('close-product-modal-btn');
if (closeDetailBtn) closeDetailBtn.addEventListener('click', closeProductDetailModal);
const prodModal = document.getElementById('product-modal');
if (prodModal) {
    prodModal.addEventListener('click', (e) => {
        if (e.target === prodModal) closeProductDetailModal();
    });
}

// ============================================================================
// HELPERS
// ============================================================================

function showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3200);
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatTypeName(id) {
    const map = {
        dry: 'Dry Skin',
        oily: 'Oily Skin',
        combination: 'Combination Skin',
        sensitive: 'Sensitive Skin',
        normal: 'Normal Skin',
        dry_frizz: 'Dry & Frizzy Hair',
        oily_scalp: 'Oily Scalp & Fine Hair',
        curly_coily: 'Curly & Coily Strands',
        damaged_color: 'Damaged / Color-Treated Hair',
        normal_hair: 'Normal & Balanced Hair',
        very_dry: 'Intensely Dry Body Skin',
        bumpy_kp: 'Rough & Bumpy (KP) Skin',
        sensitive_body: 'Sensitive & Eczema-Prone Body Skin',
        normal_body: 'Normal & Balanced Body Skin',
        chapped: 'Severely Chapped & Cracked Lips',
        dry_lips: 'Dry & Dehydrated Lips',
        pigmented_lips: 'Darkened / Pigmented Lips',
        sensitive_lips: 'Sensitive / Cheilitis-Prone Lips',
        normal_lips: 'Balanced & Volumized Lips',
        dark_circles: 'Dark Circles & Under-Eye Shadows',
        puffiness: 'Puffiness & Morning Swelling',
        fine_lines_eye: 'Crow’s Feet & Eye Wrinkles',
        dry_crepey: 'Dry & Crepey Eye Contour',
        sensitive_eyes: 'Sensitive & Reactive Eyes'
    };
    return map[id] || capitalize(id);
}
