# Daily laptop check

Instructions for the cloud routine that runs every morning. It keeps the Laptop tab's shortlist (`laptops.json`) current: it re-checks prices and stock, adds better deals, and drops anything that sold out or got beaten.

**Only edit `laptops.json`.** The page renders straight from it.

## Who's buying and what for

- A VAT-registered Swedish company buys the laptop for one person. It reclaims the moms, so every price is **ex moms**.
- Use: writing, coding with Claude, a browser and a dev server, occasional light 1080p video editing. Single-core speed matters. Heavy multi-core and graphics work don't.
- Taken on a 5-month remote stint in Vietnam (cafés, travel), so **weight and battery** matter.
- Buyer prefers **used or refurbished**. New models only go in `new_reference`, for comparison.

## Hard requirements (otherwise exclude)

1. **16 GB RAM or more** and **480 GB storage or more**.
2. **Keyboard: Swedish/Nordic, US or UK English.** If the listing doesn't say, assume Swedish for Swedish shops. On refurbed, check every keyboard option: the cheapest of these layouts wins. Another layout (DE, FR, ES, IT, CH…) is allowed only if it's at least 1,000 kr ex moms cheaper than the same machine with one of these. Start its `why` with "**German keyboard (QWERTZ).**" (or whichever layout it is).
3. **The company can buy it with full moms on the invoice.**
   - Exclude anything sold under the margin scheme (VMB / "vinstmarginalbeskattning"). Reuseit marks those listings with "Denna produkt säljs enligt vinstmarginalbeskattning". Look for that text in the *visible product text*, not in the JS bundles.
   - Exclude marketplaces where the seller is unknown (OnBuy, Amazon, CDON, Fyndiq, Blocket, Tradera, Back Market). **refurbed.se is allowed.** Its checkout has a Företag option asking for a momsreg nr and shows the "Netto" price. Record the named seller (e.g. Janado) and the country it ships from in `shop`, e.g. "refurbed (Janado, DE)". Sellers can switch an offer to the margin scheme: if the price shows "inkl. marginalbeskattning" (in company mode too), it fails this requirement.
4. **In stock or orderable.** "Slut i lager" means it's gone.
5. **Light enough to travel:** 13–14" only. No 15–16", no workstations (P-series), no L-series.
6. **Used or refurbished must be cheaper than new.** If its listed price (incl. moms) is at or above the new reference in `new_reference` for the same model and spec, drop it. Discount codes (e.g. MACPAD8) don't count, because they aren't guaranteed at checkout.

## Families worth tracking

- **MacBook Air 13"**: M1, M2, M3, M4, M5
- **MacBook Pro 14"**: M1 Pro or newer
- **ThinkPad X1 Carbon**: G9 or newer
- **ThinkPad X13**: G3 or newer (G2 only if very cheap)
- **ThinkPad T14s**: G2 or newer

Prefer Intel **U-series** chips (e.g. i7-1255U) over **P-series** (i7-1260P/1270P), because P-series run hotter and have shorter battery life. Skip Yoga/2-in-1/touch models unless they're the cheapest for their role.

## Sources

| Shop | Where to look | Price shown | Notes |
|---|---|---|---|
| Reuseit | https://reuseit.se/sv/category/laptops/macbook and https://reuseit.se/sv/category/laptops/lenovo-laptops | incl. moms → ÷ 1.25 | Check each candidate's product page for the VMB sentence. Grades: Mycket bra > Bra > Okej |
| Inrego | https://shop.inrego.se/barbara (search: https://shop.inrego.se/sok?q=x13 etc.) | incl. by default (an ex-moms toggle exists) | Grades: Mycket bra > Bra |
| TeknikFix | https://teknikfix.se/produkt-kategori/macbook/ and https://teknikfix.se/produkt-kategori/begagnade-datorer/begagnade-laptops/ | incl. by default → ÷ 1.25 (ex-moms in business mode) | Grades A+ > A > B. 12-month warranty, battery ≥80% guaranteed |
| Inet (refurbished) | https://www.inet.se/hitta?q=refurbished%20thinkpad | incl. → ÷ 1.25 | "A Grade" = battery >70% |
| MacRent | https://www.macrent.se/begagnat/begagnad-macbook/ | ex moms shown | Business-only seller; shows battery % |
| refurbed | https://www.refurbed.se/c/macbook-air/ and product pages like https://www.refurbed.se/p/apple-macbook-air-13-m5-2026/ | incl. → ÷ 1.25 (= the "Netto" price at checkout) | Grades: Nyskick > Mycket bra > Bra. 12-month warranty, 30-day returns. Check the keyboard layout dropdown: other layouts cost more |
| NetOnNet Fyndvaror | https://www.netonnet.se/art/fyndvaror/dator-surfplatta/ (search "macbook air") | incl. → ÷ 1.25 | Returned items: uncollected, cooling-off returns, or repaired units. Note which on the page if stated |
| Blocket / Tradera (private, refresh only) | the item URLs in `private.items` | — | See step 6 |
| New M5 Air reference + Black Week alert | **PriceRunner** pages (see step 5), because the shops themselves block automated fetches (NetOnNet 403, Elgiganten 429) | incl. → ÷ 1.25 | Only shops with company purchase count: NetOnNet, Inet, Elgiganten, Komplett, MacRent. Not Amazon, CDON, e-ville, OnBuy or Proshop |

Use `curl -sL -A "Mozilla/5.0"` or WebFetch. Some pages render with JS, so if a page comes back empty, try a product or search URL instead. **If you can't load a shop, don't remove its items.** Keep them and say "couldn't verify <shop>" in `status`.

Round ex-moms prices to whole kronor and set `"approx": true` when you derived them by ÷ 1.25.

## Steps

1. **Re-check every item in `items`** by opening its `url`:
   - Price changed → update `price_ex` / `price_incl`.
   - Sold out or page gone → remove it, and add "**Model** (shop, price): sold out (YYYY-MM-DD)" to `dropped`.
   - Condition grade or VMB status changed → update it, or drop it if it no longer meets the requirements.
2. **Scan the sources** for candidates that meet the hard requirements.
3. **Decide what goes on the list.** The buyer wants **every good option** listed, not just one winner per role, because good units sell within days and it helps to have backups. So:
   - Keep every candidate that meets the hard requirements and is **within ~15% of the cheapest comparable option** (same family and generation, similar condition), or that is clearly the best at something: price, condition, warranty, battery, weight or screen.
   - Drop an item only if it's sold out, fails a requirement, or another listing is **better in every way** (cheaper *and* equal-or-better specs, condition and warranty). Move it to `dropped` with a one-line reason.
   - Keep the list readable: at most ~20 items. If it's longer, drop the least competitive first.
   - Roles, used for `why` and picks:
     - Cheapest overall
     - Best value ThinkPad: cheapest 12th-gen-or-newer in top condition
     - Best ThinkPad: premium 14", light, good condition
     - Cheapest Mac
     - Best value Mac: M2 or newer Air, good condition, cheapest
     - Safest used Air: warranty or battery guarantee
     - Best screen Mac: 14" Pro
     - **Best long-term Mac:** the cheapest M4/M5 Air 13" 16 GB / 512 GB+ that is refurbished, returned or open-box (refurbed "Nyskick", NetOnNet "Fyndvara", Elgiganten Outlet) at a company-buyable seller, priced below new. Returned or outlet units must be **shippable** ("Webblager") or in a **Stockholm-area store**. Skip ones that are "Ej i webblager" and only in a store elsewhere: the buyer can't travel to pick them up.
     - **Deal alert:** any item at or under its strong-buy price in **Price floor and strong-buy prices**. These are usually gone within a day.
   - Items that aren't the best at a role still get a `why`. Start it with a short bold label such as "**Backup M5 Air.**" or "**Swedish-keyboard version.**".
4. **Picks:** give `pick` to the holder of each role above that has one. There's no limit on how many picks there are, but each role has only one holder. Each pick gets a one-sentence `pick_text`.
5. **New M5 Air price + Black Week alert.** Fetch these four PriceRunner pages (13" M5, 16 GB / 512 GB, one per colour) with `curl -sL -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"`:
   - Midnight: https://www.pricerunner.se/pl/27-3457446953/Laptops/Apple-13-inch-MacBook-Air-Apple-M5-chip-with-10-core-CPU-and-8-core-GPU-16GB-512GB-SSD-Midnight-priser
   - Sky Blue: https://www.pricerunner.se/pl/27-3457446949/Laptops/Apple-13-inch-MacBook-Air-Apple-M5-chip-with-10-core-CPU-and-8-core-GPU-16GB-512GB-SSD-Sky-Blue-priser
   - Silver: https://www.pricerunner.se/pl/27-3457446908/Laptops/Apple-13-inch-MacBook-Air-Apple-M5-chip-with-10-core-CPU-and-8-core-GPU-16GB-512GB-SSD-Silver-priser
   - Starlight: https://www.pricerunner.se/pl/27-3457446952/Laptops/Apple-13-inch-MacBook-Air-Apple-M5-chip-with-10-core-CPU-and-8-core-GPU-16GB-512GB-SSD-Starlight-priser

   Each shop's price is in the raw HTML as `"type":"merchantFilterOption","id":"…","name":"<Shop>","count":N,"lowestPrice":{"amount":"<price incl. moms>"`. Extract it with this regex: `"type":"merchantFilterOption","id":"\d+","name":"([^"]+)","count":\d+,"lowestPrice":\{"amount":"([\d.]+)"`. Keep only **NetOnNet, Inet, Elgiganten, Komplett, MacRent**, and take the cheapest across all four colours.
   - **`new_reference`:** set it to that cheapest company-buyable price (shop, colour, incl. and ÷ 1.25 ex), with the PriceRunner page as `url`.
   - **Black Week alert (runs until 2026-12-01):** if that price is **≤ 14,990 kr incl. (≈ 11,990 ex)**, add or refresh an item with `id` `"mba-m5-new-alert"`:
     - `kind` "mac", `shop` "<Shop> (new, <colour>)", `grade` "New", `approx` true.
     - `pick` "Black Week alert", `highlight` true.
     - `why`: "**Black Week alert.** New M5 Air 16/512 with Swedish keyboard, full warranty, for ~X ex moms at <Shop>." If it's ≤ 14,550 incl, add "It beats every refurbished M5 on the list."
     - Send a **PushNotification**: "Black Week: new M5 Air 16/512 at <Shop> for <incl> kr (~<ex> ex moms). Buy via Företag mode."
   - If the price rises back above 14,990 incl, or after 2026-12-01, remove the alert item and note it in `changes`.
   - If PriceRunner can't be loaded, keep `new_reference` and the alert as they are, and say so in `status`.
6. **Refresh `private`** (the hand-picked Blocket/Tradera listings). Open each item's `url` with `curl -sL -A "Mozilla/5.0"`:
   - **Blocket:** if the page returns 404 or "Sidan hittades inte", or the raw HTML contains the word `Såld`, the item is gone. Remove it and add "**Model** (Blocket, price, area): sold (D Mon)" (or "listing removed") to the front of `private.skipped`. Otherwise update `price` if the listed price changed.
   - **Tradera:** read the current bid (the number after "Ledande bud") and the end time ("Slutar …"). Update `price_label` to "X kr bid (Y with buyer protection)", using both numbers from the page. Once an auction has ended, remove the item and add "**Model** (Tradera): ended at X kr (D Mon)" to the front of `private.skipped`.
   - If a bid has gone above the ceiling written in the item's `why`, add " Bid is now over the ceiling." to the end of its `flag`, unless it's already there.
   - Set `private.checked` to today. Mention private changes in `status` and `changes` like any other change.
   - Don't rewrite the `why` of existing items, or `note` or `sold`. New listings come only from the Tradera scan below.
   - **Scan Tradera for new MacBooks.** Fetch these searches, newest first, with `curl -sL -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"`:
     - https://www.tradera.com/search?q=macbook%20air%20m5&sortBy=AddedOn
     - https://www.tradera.com/search?q=macbook%20air%20m4&sortBy=AddedOn
     - https://www.tradera.com/search?q=macbook%20air%20m3&sortBy=AddedOn
     - https://www.tradera.com/search?q=macbook%20air%20m2%2016gb&sortBy=AddedOn
     - https://www.tradera.com/search?q=macbook%20pro%2014%20m1%20pro&sortBy=AddedOn
     - https://www.tradera.com/search?q=macbook%20pro%2014%20m2%20pro&sortBy=AddedOn
     - https://www.tradera.com/search?q=macbook%20air%2024gb&sortBy=AddedOn
     - https://www.tradera.com/search?q=macbook%20air%2016gb%20512&sortBy=AddedOn

     **Also scan Blocket** the same way (item links look like `/recommerce/forsale/item/<id>`; the search pages are plain HTML):
     - https://www.blocket.se/recommerce/forsale/search?q=macbook%20air%20m5&sort=PUBLISHED_DESC
     - https://www.blocket.se/recommerce/forsale/search?q=macbook%20air%20m4&sort=PUBLISHED_DESC
     - https://www.blocket.se/recommerce/forsale/search?q=macbook%20air%20m3&sort=PUBLISHED_DESC
     - https://www.blocket.se/recommerce/forsale/search?q=macbook%20air%20m2%2016gb&sort=PUBLISHED_DESC
     - https://www.blocket.se/recommerce/forsale/search?q=macbook%20pro%2014&sort=PUBLISHED_DESC

     Only look at item links in the laptop category (`/item/302393/…`). Skip any URL already in `private.items`, or whose model and price already appear in `private.skipped`. Open each remaining listing and read its title, description, price, and whether it's "Köp nu" (fixed price) or an auction ("Ledande bud", "Slutar …").

     A listing qualifies if **all** of these hold:
     - 13" MacBook Air (M2 or newer) or 14" MacBook Pro (M1 Pro or newer). No 15"/16", no Intel.
     - **16 GB RAM or more and 512 GB storage or more**, stated in the title or description. If either isn't stated, skip it.
     - Keyboard is Nordic, US or UK English (or not stated). Skip DE, FR and other layouts. Not "defekt", "trasig", "för delar", "iCloud-låst", or a box/accessory only.
     - Price at or under the **watch price** for its model (table in **Price floor and strong-buy prices**). For "Köp nu" or Blocket, use the asking price. For an auction, use the **current bid plus buyer protection**, whatever its end time: the list tracks the bid every day, so a good auction should be on it from the day it appears, not only in its last 48 hours.

     A private seller can't give a moms invoice, so compare the full price. **Don't filter out good listings for being slightly above the strong-buy price**: the buyer wants every good option on the list and decides for themselves.

     Two tiers:
     - **At or under the strong-buy price:** `why` starts with "**Strong buy.**", send the PushNotification below.
     - **Between strong-buy and watch price:** `why` starts with "**Worth watching.**", no push. For auctions, write a bid ceiling in the `flag` ("Ceiling: X kr incl. buyer protection", using the watch price).

     Add each qualifying listing to `private.items`, with `site` "Tradera" and `where` set to the seller's town, plus "auction, ends D Mon HH:MM" or "Köp nu". Fixed price → `price`. Auction → `price: null` and `price_label` "X kr bid (Y with buyer protection)". `why` starts with "**New on Tradera.**", then one short sentence on condition and battery from the ad. Its `flag` says what to check (keyboard, battery, warranty, and for auctions: "Final price will climb; strong-buy price X"). Add it to `changes`. For strong buys, send a **PushNotification**: "Tradera: <model> for <price> kr (<Köp nu / auction ends …>). <url>". Keep at most 12 items in `private.items`; if there are more, remove the weakest "Worth watching" ones first (highest price relative to its watch price).
     If the searches can't be loaded, say "couldn't scan Tradera" or "couldn't scan Blocket" in `status`. Facebook Marketplace needs a login, so it can't be scanned; many of its MacBook ads are Tradera auctions anyway.
7. **Bookkeeping:**
   - `checked` = today's date in Europe/Stockholm (YYYY-MM-DD).
   - `checked_at` = the time you finished, in Europe/Stockholm (HH:MM). **Update it on every run, even when nothing else changed**, so the page shows the routine is alive.
   - `status` must describe *this* run, even if it's "No changes since yesterday". Mention that Blocket/Tradera were re-checked.
   - `status` = one short sentence about today, e.g. "Checked all 5 shops, no changes." or "Reuseit M2 Air dropped 400 kr; couldn't verify Inet."
   - Add one entry to the front of `changes` (`{date, text}`) **only if something changed**. Keep the 30 newest.
   - Keep `dropped` to the 20 most useful entries, newest reasons first.
   - Order `items`: ThinkPads by price, then Macs by price. Set `highlight: true` on the picks.
8. **Style:** plain English, short. Each `why` starts with its role in bold (`**Best value Mac.** …`). Only `**bold**` markup is allowed; no HTML.
9. **Validate and publish:**
   - `python3 -m json.tool laptops.json > /dev/null` must pass.
   - Always commit (at least `checked_at` changes) to `main` with the message `Daily laptop check YYYY-MM-DD` and push. If the push is rejected, `git pull --rebase` and push again.
   - Don't edit any other file.

## Don't

- Don't invent prices or stock. If unsure, leave the item as it is and say so in `status`.
- Don't add anything that fails a hard requirement, however cheap it is.
- Don't change the requirements or roles. Only the buyer changes those, by editing this file.
- Don't re-rank `private` listings, and add new ones only from the Tradera scan in step 6. That list is kept separately because private sellers can't give a moms invoice, so the hard requirements on moms and marketplaces don't apply to it.

## Price floor and strong-buy prices

The buyer's **price floor is a new MacBook Air 13" M5 16/512 at 14,500 kr incl. moms (11,600 ex)**. Second-hand only makes sense below that, so a used machine is a **strong buy** at or under these prices. **Company cost** = the ex-moms price from a shop that invoices with moms, or the **full price** from a private seller or a margin-scheme offer (no moms to reclaim).

| Model (16 GB / 512 GB+) | Strong buy at or below (company cost) | Watch price: list it at or below |
|---|---|---|
| MacBook Air 13" M5, used or refurbished | 10,400 | 12,000 |
| MacBook Air 13" M4 | 9,300 | 11,000 |
| MacBook Air 13" M3 | 8,700 | 9,800 |
| MacBook Air 13" M2 | 7,600 | 8,500 |
| MacBook Pro 14" M1 Pro or M2 Pro | 7,000 | 8,500 |
| ThinkPad X1 Carbon G10+ / X13 G3+ (16 GB / 480 GB+) | 4,300 | 5,500 |

The strong-buy numbers are also in `strong_buy` in laptops.json, which the page shows. Watch prices sit roughly halfway between strong buy and what a new M5 costs the company; anything above them loses to buying new. Only the buyer changes either column.

## Hourly deal watch (weekdays, daytime)

A second, lighter routine runs **every hour on weekdays during the day** with the prompt "Follow the *Hourly deal watch* section of ROUTINE.md". The buyer's boss can approve a purchase on the spot during those hours, so the goal is to catch a great deal **within the hour**. The page sends a desktop notification for every item that is new to the list, so only add things worth interrupting someone for.

**Do only this:**
1. Look for **new** listings that beat these thresholds. Don't re-check existing items, and don't touch `new_reference`, `dropped`, picks of other items, or `private.sold`.

   - **Used, refurbished or returned machines** at Reuseit, TeknikFix, Inrego, Inet, refurbed (margin scheme counts at full price) and Tradera: at or under the strong-buy price in **Price floor and strong-buy prices**.
   - **New MacBook Air 13" M5 16/512** at a company-buyable shop (PriceRunner pages in step 5): **≤ 14,990 kr incl.** At ≤ 14,500 the floor is reached; say "Floor reached: buy new" in its `why`.

   Use the shop URLs in **Sources**. The hard requirements still apply (keyboard: Nordic, US or UK; in stock; 13–14"), except that a margin-scheme offer may qualify if its **full price** is at or under the strong-buy price. On refurbed, check each product page's keyboard options for the cheapest acceptable layout.
2. **Shop deals** go into `items` with `pick` "Deal alert", `highlight` true, a `why` starting with "**Deal alert.**", and `found_at` "YYYY-MM-DD HH:MM" (Europe/Stockholm). **Tradera and Blocket finds** go into `private.items` as described in step 6, also with `found_at`, but in the hourly run add **strong buys only**; the daily run adds the "Worth watching" tier.
3. Skip anything whose URL is already in `items`, `private.items`, `dropped` or `private.skipped`. Never re-add something that was dropped.
4. **If you added something:** add one line to the front of `changes`, validate the JSON, commit with the message `Hourly deal: <model> <price>` and push (on rejection, `git pull --rebase` and push again). Also send a **PushNotification** with the model, price and URL.
5. **If you found nothing, change nothing and don't commit.** No status updates, no `checked_at`: the daily run handles bookkeeping.
6. Keep it quick. If a site can't be loaded, skip it this hour.

