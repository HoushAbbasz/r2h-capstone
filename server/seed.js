import mysql from "mysql2/promise";
import bcrypt from "bcrypt";
import "dotenv/config";

const seed = async () => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host:     process.env.DB_HOST,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: "lrnr",
      timezone: "Z", 
    });

    console.log("Connected to lrnr database");

    // ── Clear existing seed data (safe to re-run) ──────────────────────────
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");
    await connection.query("TRUNCATE TABLE BID");
    await connection.query("TRUNCATE TABLE MESSAGE");
    await connection.query("TRUNCATE TABLE REPORT");
    await connection.query("TRUNCATE TABLE ITEM");
    await connection.query("TRUNCATE TABLE USER");
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    console.log("Cleared existing data");

    // ── Seed Users ─────────────────────────────────────────────────────────
    const password = await bcrypt.hash("Password1", 10);
    const adminPw  = await bcrypt.hash("Admin1234", 10);

    const [userResult] = await connection.query(
      `INSERT INTO USER (username, password_hash, admin) VALUES
        ('admin',        ?, 1),
        ('anime_shop',   ?, 0),
        ('otaku_vault',  ?, 0),
        ('collector99',  ?, 0),
        ('weeaboo_shop', ?, 0)`,
      [adminPw, password, password, password, password]
    );
    console.log("Users seeded — all non-admin passwords are: Password1");
    console.log("Admin password: Admin1234");

    // ── Seed Items ─────────────────────────────────────────────────────────
    // seller_ids: anime_shop=2, otaku_vault=3, collector99=4, weeaboo_shop=5
    const now = new Date();
    const days = (n) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

    await connection.query(
      `INSERT INTO ITEM
        (item_name, description, starting_bid, start_date, end_date, seller_id, status, image)
       VALUES
        (?, ?, ?, NOW(), ?, ?, 'active', ?),
        (?, ?, ?, NOW(), ?, ?, 'active', ?),
        (?, ?, ?, NOW(), ?, ?, 'active', ?),
        (?, ?, ?, NOW(), ?, ?, 'active', ?),
        (?, ?, ?, NOW(), ?, ?, 'active', ?),
        (?, ?, ?, NOW(), ?, ?, 'active', ?),
        (?, ?, ?, NOW(), ?, ?, 'active', ?),
        (?, ?, ?, NOW(), ?, ?, 'active', ?),
        (?, ?, ?, NOW(), ?, ?, 'active', ?),
        (?, ?, ?, NOW(), ?, ?, 'active', ?),
        (?, ?, ?, NOW(), ?, ?, 'active', ?),
        (?, ?, ?, NOW(), ?, ?, 'active', ?),
        (?, ?, ?, NOW(), ?, ?, 'active', ?),
        (?, ?, ?, NOW(), ?, ?, 'active', ?),
        (?, ?, ?, NOW(), ?, ?, 'active', ?)`,
      [
        // 1
        "Ace One Piece Figure",
        "Highly detailed Portgas D. Ace figurine from One Piece. Approx 8 inches tall, mint condition in original box.",
        18.99, days(4), 2, "/images/ace-one-piece.png",

        // 2
        "Appa Plush Pillow Pet – ATLA",
        "Giant Appa pillow pet from Avatar: The Last Airbender. Super soft, great condition, perfect for any ATLA fan.",
        22.00, days(6), 2, "/images/appa-pillow-pet-atla.png",

        // 3
        "Aang & Momo Rubber Duck Set – ATLA",
        "Collectible rubber duck set featuring Aang and Momo from Avatar: The Last Airbender. Unused, still in packaging.",
        9.50, days(2), 3, "/images/atla-aang-and-momo-rubberduck.png",

        // 4
        "Tony Tony Chopper Figurine – One Piece",
        "Adorable Chopper figurine from One Piece. About 5 inches, excellent condition, no missing parts.",
        14.00, days(5), 3, "/images/chopper-one-piece-figurine.png",

        // 5
        "DBZ Sneakers – Blue Edition",
        "Dragon Ball Z themed blue sneakers. Size 10. Lightly worn, still in great shape. Super Saiyan style.",
        45.00, days(3), 4, "/images/DBZ-Sneakers-Blue.png",

        // 6
        "Earthbender Christmas Sweater – ATLA",
        "Cozy Avatar: The Last Airbender Earthbender holiday sweater. Size M. Never worn, tags still on.",
        28.00, days(7), 4, "/images/Earthbender-christmas-sweater.png",

        // 7
        "FMA Brotherhood – Elric Brothers T-Shirt",
        "Fullmetal Alchemist Brotherhood tee featuring Edward and Alphonse Elric. Size L. Worn twice, excellent condition.",
        12.50, days(3), 5, "/images/fmab-elric-brothers-tshirt.png",

        // 8
        "FMA Brotherhood Medallion",
        "Fullmetal Alchemist Brotherhood collectible medallion. Metal finish, comes with display stand. Mint condition.",
        19.99, days(5), 2, "/images/fmab-medallion.png",

        // 9
        "Goku Xbox Controller – Custom DBZ",
        "Custom Dragon Ball Z Goku-themed Xbox controller. Fully functional, light cosmetic wear on grips only.",
        55.00, days(8), 3, "/images/Goku_Xbox_Controler.png",

        // 10
        "Naruto Uzumaki Figurine",
        "Classic Naruto Uzumaki figurine in his iconic orange jumpsuit. About 7 inches, excellent condition.",
        16.00, days(4), 4, "/images/naruto-figurine.png",

        // 11
        "Naruto & Kakashi T-Shirt",
        "Naruto Shippuden tee featuring Naruto and Kakashi. Size XL. Washed once, no fading or damage.",
        11.00, days(2), 5, "/images/naruto-kakashi-tshirt.png",

        // 12
        "Naruto Rasengan Figurine",
        "Naruto performing the Rasengan — dynamic pose, great detail. About 9 inches tall. Mint in box.",
        24.99, days(6), 2, "/images/naruto-rasengan-figurine.png",

        // 13
        "Orange DBZ Slides",
        "Dragon Ball Z themed orange slide sandals. Size 11. Worn a handful of times, still very clean.",
        20.00, days(3), 3, "/images/orange_DBZ_slides.png",

        // 14
        "Pokémon Nintendo Switch Bundle",
        "Nintendo Switch with Pokémon branding. Includes console, dock, and both Joy-Cons. Excellent condition.",
        180.00, days(10), 4, "/images/pokemon-nintendo-switch.png",

        // 15
        "Purple Pokémon Backpack",
        "Large Pokémon themed backpack in purple. Multiple compartments, laptop sleeve included. Barely used.",
        32.00, days(5), 5, "/images/purple-pokemon-backpack.png",
      ]
    );
    console.log("Items seeded");

    // ── Seed some bids to make it feel lively ─────────────────────────────
    await connection.query(
      `INSERT INTO BID (item_id, bidder_id, amount, bid_time) VALUES
        (1, 3, 20.00, NOW()),
        (1, 4, 23.50, NOW()),
        (2, 5, 25.00, NOW()),
        (3, 2, 10.00, NOW()),
        (3, 4, 13.00, NOW()),
        (5, 3, 48.00, NOW()),
        (5, 5, 52.00, NOW()),
        (9, 2, 60.00, NOW()),
        (9, 4, 67.50, NOW()),
        (10, 3, 18.00, NOW()),
        (12, 5, 27.00, NOW()),
        (14, 3, 190.00, NOW()),
        (14, 5, 205.00, NOW()),
        (14, 2, 215.00, NOW())`
    );

    // Update current_bid to match highest bid for those items
    await connection.query(`UPDATE ITEM SET current_bid = 23.50 WHERE item_id = 1`);
    await connection.query(`UPDATE ITEM SET current_bid = 25.00 WHERE item_id = 2`);
    await connection.query(`UPDATE ITEM SET current_bid = 13.00 WHERE item_id = 3`);
    await connection.query(`UPDATE ITEM SET current_bid = 52.00 WHERE item_id = 5`);
    await connection.query(`UPDATE ITEM SET current_bid = 67.50 WHERE item_id = 9`);
    await connection.query(`UPDATE ITEM SET current_bid = 18.00 WHERE item_id = 10`);
    await connection.query(`UPDATE ITEM SET current_bid = 27.00 WHERE item_id = 12`);
    await connection.query(`UPDATE ITEM SET current_bid = 215.00 WHERE item_id = 14`);

    console.log("Bids seeded");
    console.log("\n✅ Seed complete!");
    console.log("─────────────────────────────────");
    console.log("Users created:");
    console.log("  admin        / Admin1234  (admin)");
    console.log("  anime_shop   / Password1");
    console.log("  otaku_vault  / Password1");
    console.log("  collector99  / Password1");
    console.log("  weeaboo_shop / Password1");
    console.log("─────────────────────────────────");
    console.log("15 items seeded with images");
    console.log("14 bids seeded across 8 items");

    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
};

seed();