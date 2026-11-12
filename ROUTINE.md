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
     - **Deal alert:** any M3/M4/M5 Air 13" with 16 GB / 512 GB+ under **9,000 kr ex moms**.
   - Items that aren't the best at a role still get a `why`. Start it with a short bold label such as "**Backup M5 Air.**" or "**Swedish-keyboard version.**".
4. **Picks:** give `pick` to the holder of each role above that has one. There's no limit on how many picks there are, but each role has only one holder. Each pick gets a one-sentence `pick_text`.
5. **New M5 Air price + Black Week alert.** Fetch these four PriceRunner pages (13" M5, 16 GB / 512 GB, one per colour) with `curl -sL -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"`:
   - Midnight: https://www.pricerunner.se/pl/27-3457446953/Laptops/Apple-13-inch-MacBook-Air-Apple-M5-chip-with-10-core-CPU-and-8-core-GPU-16GB-512GB-SSD-Midnight-priser
   - Sky Blue: https://www.pricerunner.se/pl/27-3457446949/Laptops/Apple-13-inch-MacBook-Air-Apple-M5-chip-with-10-core-CPU-and-8-core-GPU-16GB-512GB-SSD-Sky-Blue-priser
   - Silver: https://www.pricerunner.se/pl/27-3457446908/Laptops/Apple-13-inch-MacBook-Air-Apple-M5-chip-with-10-core-CPU-and-8-core-GPU-16GB-512GB-SSD-Silver-priser
   - Starlight: https://www.pricerunner.se/pl/27-3457446952/Laptops/Apple-13-inch-MacBook-Air-Apple-M5-chip-with-10-core-CPU-and-8-core-GPU-16GB-512GB-SSD-Starlight-priser

   Each shop's price is in the raw HTML as `"type":"merchantFilterOption","id":"…","name":"<Shop>","count":N,"lowestPrice":{"amount":"<price incl. moms>"`. Extract it with this regex: `"type":"merchantFilterOption","id":"\d+","name":"([^"]+)","count":\d+,"lowestPrice":\{"amount":"([\d.]+)"`. Keep only **NetOnNet, Inet, Elgiganten, Komplett, MacRent**, and take the cheapest across all four colours.
   - **`new_reference`:** set it to that cheapest company-buyable price (shop, colour, incl. and ÷ 1.25 ex), with the PriceRunner page as `url`.
   - **Black Week alert (runs until 2026-12-01):** if that price is **≤ 15,500 kr incl. (≈ 12,400 ex)**, add or refresh an item with `id` `"mba-m5-new-alert"`:
     - `kind` "mac", `shop` "<Shop> (new, <colour>)", `grade` "New", `approx` true.
     - `pick` "Black Week alert", `highlight` true.
     - `why`: "**Black Week alert.** New M5 Air 16/512 with Swedish keyboard, full warranty, for ~X ex moms at <Shop>." If it's ≤ 14,550 incl, add "It beats every refurbished M5 on the list."
     - Send a **PushNotification**: "Black Week: new M5 Air 16/512 at <Shop> for <incl> kr (~<ex> ex moms). Buy via Företag mode."
   - If the price rises back above 15,500 incl, or after 2026-12-01, remove the alert item and note it in `changes`.
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

     Only look at item links in the laptop category (`/item/302393/…`). Skip any URL already in `private.items`, or whose model and price already appear in `private.skipped`. Open each remaining listing and read its title, description, price, and whether it's "Köp nu" (fixed price) or an auction ("Ledande bud", "Slutar …").

     A listing qualifies if **all** of these hold:
     - 13" MacBook Air (M2 or newer) or 14" MacBook Pro (M1 Pro or newer). No 15"/16", no Intel.
     - **16 GB RAM or more and 512 GB storage or more**, stated in the title or description. If either isn't stated, skip it.
     - Keyboard is Nordic, US or UK English (or not stated). Skip DE, FR and other layouts. Not "defekt", "trasig", "för delar", "iCloud-låst", or a box/accessory only.
     - Price at or under the ceiling for its model. For "Köp nu", use the buy-now price. For an auction, use the current bid, and only if it **ends within 48 hours**.

     | Model | Ceiling (kr) |
     |---|---|
     | Air 13" M5 16/512 | 12,000 |
     | Air 13" M4 16/512 | 11,500 |
     | Air 13" M3 16/512 | 9,500 |
     | Air 13" M2 16/512 | 8,000 |
     | Pro 14" M1 Pro 16/512 or newer | 7,500 |

     These are below the typical sold prices in `private.sold`, and below what the company pays for a new M5 ex moms.

     Add each qualifying listing to `private.items`, with `site` "Tradera" and `where` set to the seller's town, plus "auction, ends D Mon HH:MM" or "Köp nu". Fixed price → `price`. Auction → `price: null` and `price_label` "X kr bid (Y with buyer protection)". `why` starts with "**New on Tradera.**", then one short sentence on condition and battery from the ad. Its `flag` says what to check (keyboard, battery, warranty, and for auctions: "Final price will climb; ceiling X"). Add it to `changes` and send a **PushNotification**: "Tradera: <model> for <price> kr (<Köp nu / auction ends …>). <url>". Keep at most 8 items in `private.items`; if there are more, remove the oldest Tradera ones first.
     If the searches can't be loaded, say "couldn't scan Tradera" in `status`.
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
