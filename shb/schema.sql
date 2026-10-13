-- Skin, Hair & Body Care Database Schema (MySQL)
-- Personalized Product Recommendation System

CREATE DATABASE IF NOT EXISTS `shb_beauty` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `shb_beauty`;

-- Users Table
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(60) NOT NULL UNIQUE,
    `email` VARCHAR(120) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- User Profiles / Questionnaire Responses
CREATE TABLE IF NOT EXISTS `user_profiles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL UNIQUE,
    `skin_type` ENUM('oily', 'dry', 'combination', 'sensitive', 'normal') NOT NULL DEFAULT 'combination',
    `skin_concerns` TEXT, -- JSON array e.g. ["acne", "dehydration", "redness"]
    `hair_texture` ENUM('straight', 'wavy', 'curly', 'coily') NOT NULL DEFAULT 'wavy',
    `scalp_type` ENUM('oily', 'dry', 'balanced', 'sensitive') NOT NULL DEFAULT 'balanced',
    `hair_concerns` TEXT, -- JSON array e.g. ["frizz", "thinning", "color_damage"]
    `body_skin_type` ENUM('normal', 'very_dry', 'bumpy_kp', 'sensitive') NOT NULL DEFAULT 'normal',
    `sun_exposure` ENUM('low', 'moderate', 'high') NOT NULL DEFAULT 'moderate',
    `fragrance_preference` ENUM('fragrance_free', 'any') NOT NULL DEFAULT 'any',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Categories Table
CREATE TABLE IF NOT EXISTS `categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `slug` VARCHAR(50) NOT NULL UNIQUE,
    `name` VARCHAR(80) NOT NULL,
    `description` VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Products Table
CREATE TABLE IF NOT EXISTS `products` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `category_id` INT NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `brand` VARCHAR(100) NOT NULL,
    `sub_type` VARCHAR(80) NOT NULL, -- e.g. 'Cleanser', 'Serum', 'Moisturizer', 'Sunscreen', 'Shampoo', 'Scalp Serum', 'Body Lotion'
    `routine_time` ENUM('AM', 'PM', 'Both', 'Weekly') NOT NULL DEFAULT 'Both',
    `step_order` INT NOT NULL DEFAULT 1,
    `price` DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    `description` TEXT NOT NULL,
    `key_actives` TEXT NOT NULL, -- Comma-separated or JSON list
    `suitable_skin_types` VARCHAR(255) NOT NULL, -- e.g. "oily,combination,normal"
    `targeted_concerns` VARCHAR(255) NOT NULL, -- e.g. "acne,pores,hyperpigmentation"
    `is_fragrance_free` TINYINT(1) NOT NULL DEFAULT 1,
    `rating` DECIMAL(2,1) NOT NULL DEFAULT 4.8,
    `image_icon` VARCHAR(50) DEFAULT 'droplet',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed Categories
INSERT INTO `categories` (`id`, `slug`, `name`, `description`) VALUES
(1, 'skincare', 'Skincare', 'Formulations for facial barrier health, tone, and hydration'),
(2, 'haircare', 'Hair Care', 'Scalp balancing and strand-strengthening solutions'),
(3, 'bodycare', 'Body Care', 'Nourishing cleansers, targeted barrier lotions, and UV defense'),
(4, 'lipcare', 'Lip Care', 'Intense moisture masks, peptide plumpers, and UV lip barriers'),
(5, 'eyecare', 'Eye Care', 'Targeted depuffing caffeine serums, peptide firmers, and ceramide eye balms')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Seed Curated Products
INSERT INTO `products` (`category_id`, `name`, `brand`, `sub_type`, `routine_time`, `step_order`, `price`, `description`, `key_actives`, `suitable_skin_types`, `targeted_concerns`, `is_fragrance_free`, `rating`, `image_icon`) VALUES
-- Skincare Products
(1, 'Gentle Hydrating Cleanser', 'PureBiome Labs', 'Cleanser', 'Both', 1, 19.00, 'Non-stripping amino acid cleansing wash that removes impurities without disrupting the lipid moisture barrier.', 'Ceramides NP, Amino Acids, Colloidal Oat', 'dry,sensitive,normal,combination', 'dehydration,redness,barrier_damage', 1, 4.9, 'droplets'),
(1, 'Clarifying BHA Pore Wash', 'DermaClear', 'Cleanser', 'Both', 1, 22.00, 'Micro-foaming cleanser with encapsulated salicylic acid and zinc PCA to unclog pores and reduce excess sebum.', 'Salicylic Acid 1.5%, Zinc PCA, Green Tea', 'oily,combination', 'acne,pores,oiliness', 1, 4.8, 'sparkles'),
(1, 'Luminous Niacinamide + Zinc Serum', 'Velvet Radiance', 'Active Serum', 'Both', 2, 28.00, 'Weightless balancing serum designed to refine pore texture, fade dark marks, and even skin tone.', 'Niacinamide 10%, Zinc PCA 1%, Licorice Root', 'oily,combination,normal', 'acne,hyperpigmentation,pores', 1, 4.9, 'activity'),
(1, 'Barrier Restore Ceramide Cloud Cream', 'Aura Dermaceuticals', 'Moisturizer', 'Both', 3, 34.00, 'Rich velvety cream infused with five multi-molecular ceramides and squalane to deeply soothe dry and compromised skin.', 'Ceramides 1-3-6, Squalane, Hyaluronic Acid', 'dry,sensitive,combination', 'dehydration,redness,fine_lines', 1, 4.9, 'shield'),
(1, 'Ultra-Light Invisible Water Gel', 'HydraBalance', 'Moisturizer', 'Both', 3, 26.00, 'Oil-free quenching gel cream that locks in 72-hour moisture with zero greasy finish.', 'Centella Asiatica, Hyaluronic Acid, Panthenol', 'oily,combination', 'oiliness,dehydration', 1, 4.7, 'sun'),
(1, 'Invisible Silk Mineral Fluid SPF 50+', 'SolShade Lab', 'Sunscreen', 'AM', 4, 32.00, 'Featherlight broad-spectrum mineral sunscreen that leaves no white cast and delivers an invisible matte glow.', 'Zinc Oxide 12%, Ectoin, Vitamin E', 'oily,dry,combination,sensitive,normal', 'sun_protection,anti_aging,redness', 1, 4.9, 'sun'),
(1, 'Midnight Retinol Lipid Oil', 'ChronoRepair', 'Night Treatment', 'PM', 3, 42.00, 'Encapsulated slow-release retinol suspended in nourishing rosehip seed oil for overnight renewal without redness.', 'Granactive Retinoid 2%, Rosehip Oil, Bakuchiol', 'dry,combination,normal', 'fine_lines,hyperpigmentation,texture', 1, 4.8, 'moon'),

-- Hair Care Products
(1, 'Rosemary Peppermint Scalp Clarifier', 'Follicle Botanics', 'Scalp Pre-Wash', 'Weekly', 1, 24.00, 'Exfoliating AHA and rosemary scalp serum that lifts product buildup, balances sebum, and revitalizes follicles.', 'Rosemary Leaf Extract, Glycolic Acid 3%, Biotin', 'oily,balanced', 'flaky_scalp,thinning,oiliness', 1, 4.8, 'feather'),
(2, 'Peptide Bond Repair Hair Mask', 'StrandTheory', 'Deep Conditioner', 'Weekly', 2, 38.00, 'Bio-identical peptide formulation that repairs broken keratin bonds caused by heat and color treatments.', 'Oligopeptide-78, Hydrolyzed Quinoa, Shea Butter', 'wavy,curly,coily,straight', 'color_damage,breakage,frizz', 1, 4.9, 'award'),
(2, 'Weightless Botanical Volumizing Cleanse', 'Verde Hair Lab', 'Shampoo', 'Both', 1, 21.00, 'Sulfate-free invigorating cleanser that boosts lift at the root for fine and easily weighed down strands.', 'Apple Amino Acids, Rice Protein, Bamboo Extract', 'straight,wavy', 'thinning,flatness', 0, 4.7, 'wind'),
(2, 'Curl Defining Moisture Butter', 'Flora & Coil', 'Leave-In Styling', 'Both', 3, 27.00, 'Intensely nourishing curl-clumping cream that locks in bounce, elongates coils, and seals split ends.', 'Murumuru Butter, Flaxseed Gel, Argan Oil', 'curly,coily', 'frizz,dryness', 1, 4.9, 'heart'),
(2, 'Scalp Calming Prebiotic Serum', 'DermaScalp', 'Scalp Serum', 'Both', 3, 29.00, 'Soothing leave-in peptide drops that comfort dry, tight, or sensitive scalps and rebuild microbiome balance.', 'Prebiotics, Niacinamide 3%, Allantoin', 'dry,sensitive', 'flaky_scalp,sensitivity', 1, 4.8, 'shield'),

-- Body Care Products
(3, 'Lactic Acid 10% Smoothing Body Polish', 'KeraSmooth', 'Exfoliator', 'Both', 1, 28.00, 'Gentle chemical smoothing wash that dissolves keratin plugs and rough keratosis pilaris bumps without scratching.', 'Lactic Acid 10%, Urea 5%, Niacinamide', 'bumpy_kp,normal', 'rough_texture,ingrowns', 1, 4.9, 'sparkles'),
(3, 'Replenishing Ceramide Lipid Body Balm', 'HydraSoma', 'Body Cream', 'Both', 2, 25.00, 'Rich 24-hour restorative body butter designed to rescue intensely dry and eczema-prone skin barriers.', 'Ceramide Complex, Colloidal Oatmeal, Shea', 'very_dry,sensitive', 'extreme_dryness,itchiness,barrier_damage', 1, 4.9, 'shield'),
(3, 'Radiant Glow SPF 50 Mineral Body Silk', 'Soleil Veil', 'Body Sunscreen', 'AM', 3, 30.00, 'Water-resistant, non-sticky mineral sunscreen with light-reflecting mica and antioxidant rich jojoba oil.', 'Non-Nano Zinc Oxide, Jojoba Oil, Vitamin C', 'normal,very_dry,bumpy_kp,sensitive', 'sun_protection,dullness', 1, 4.8, 'sun'),
(3, 'Botanical Firming Body Oil', 'Elixir Botanica', 'Body Oil', 'PM', 3, 36.00, 'Fast-absorbing dry oil that enhances skin elasticity, nourishes stretch-prone zones, and seals in hydration.', 'Marula Oil, Sweet Almond Oil, Squalane', 'very_dry,normal', 'dryness,loss_of_elasticity', 0, 4.7, 'droplet'),

-- Lip Care Products
(4, 'Overnight Peptide Barrier Lip Butter', 'PureBiome Labs', 'Lip Treatment', 'PM', 1, 16.00, 'Deeply restorative overnight sleeping butter that heals chapped, bleeding, or cracked lip tissue with bio-identical lipids.', 'Palmitoyl Tripeptide-1, Ceramide NP, Shea Butter', 'chapped,dry,sensitive', 'cracked_lips,peeling,dryness', 1, 4.9, 'heart'),
(4, 'Mineral Silk Lip Shield SPF 30', 'SolShade Lab', 'Lip Balm', 'AM', 1, 14.00, 'Hydrating invisible mineral sunscreen balm with natural waxes and antioxidants to prevent photo-damage and pigmentation.', 'Zinc Oxide 8%, Vitamin E, Jojoba Oil', 'chapped,dry,pigmented,normal', 'sun_protection,dark_borders', 1, 4.8, 'sun'),
(4, 'Bio-Plumping Hyaluronic Lip Nectar', 'Velvet Radiance', 'Lip Plumper', 'Both', 2, 22.00, 'Non-stinging volume gloss with multi-molecular hyaluronic spheres that delivers plush, pillowy bounce and glass shine.', 'Hyaluronic Acid Micro-Spheres, Volulip, Squalane', 'normal,dry,pigmented', 'fine_lines,thinness,dullness', 1, 4.9, 'sparkles'),
(4, 'Cica Calming Lip Rescue Salve', 'Aura Dermaceuticals', 'Lip Salve', 'Both', 1, 15.00, 'Hypoallergenic soothing salve formulated without irritants or flavorings to soothe contact cheilitis and reactive lips.', 'Centella Asiatica, Bisabolol, Panthenol 5%', 'sensitive,chapped', 'stinging,redness,reactivity', 1, 4.9, 'shield'),

-- Eye Care Products
(5, 'Caffeine 5% + EGCG Depuffing Eye Serum', 'Velvet Radiance', 'Eye Serum', 'AM', 1, 26.00, 'High-potency botanical drainage fluid that visibly reduces morning under-eye water retention and vascular shadows.', 'Caffeine 5%, Green Tea EGCG, Niacinamide', 'puffiness,dark_circles', 'swollen_bags,vascular_hollows', 1, 4.9, 'sparkles'),
(5, 'Multi-Peptide 360° Firming Eye Elixir', 'StrandTheory', 'Eye Treatment', 'Both', 2, 38.00, 'Advanced firming formula targeting crow’s feet, eyelid laxity, and fine dynamic crinkles around the orbital bone.', 'Matrixyl 3000, Argireline 10%, Haloxyl', 'fine_lines,dry_crepey', 'crows_feet,loss_of_firmness', 1, 4.9, 'award'),
(5, 'Barrier Restorative Ceramide Eye Balm', 'PureBiome Labs', 'Eye Cream', 'Both', 2, 29.00, 'Intensely nourishing cushion cream that seals moisture into crepey, parchment-thin under-eye skin without causing milia.', 'Ceramides 1-3-6, Plant Squalane, Vitamin E', 'dry_crepey,sensitive_eyes', 'thinness,dehydration_lines', 1, 4.8, 'shield'),
(5, 'Gentle Bakuchiol Eye Renewal Complex', 'ChronoRepair', 'Night Eye Treatment', 'PM', 2, 34.00, 'Plant-derived retinol alternative designed specifically for delicate periorbital tissue to fade dark circles and smooth texture.', 'Bakuchiol 1%, Chrysin, Hyaluronic Acid', 'dark_circles,fine_lines,sensitive_eyes', 'pigmentation,tired_look', 1, 4.8, 'moon');
