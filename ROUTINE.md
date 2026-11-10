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
2. **Swedish/Nordic keyboard.** If the listing doesn't say, it's fine to assume Swedish for Swedish shops, but exclude anything marked US, UK, DE, DK etc.
3. **The company can buy it with full moms on the invoice.**
   - Exclude anything sold under the margin scheme (VMB / "vinstmarginalbeskattning"). Reuseit marks those listings with "Denna produkt säljs enligt vinstmarginalbeskattning". Look for that text in the *visible product text*, not in the JS bundles.
   - Exclude marketplaces where the seller is unknown (OnBuy, Amazon, CDON, Fyndiq, Blocket, Tradera, Back Market).
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
| Blocket / Tradera (private, refresh only) | the item URLs in `private.items` | — | See step 6 |
| New M5 Air reference | NetOnNet, Inet, Elgiganten, Komplett, MacRent (all have company purchase) | incl. → ÷ 1.25 | Only for `new_reference`. Not Amazon, not OnBuy, not Proshop (business purchase unconfirmed) |

Use `curl -sL -A "Mozilla/5.0"` or WebFetch. Some pages render with JS, so if a page comes back empty, try a product or search URL instead. **If you can't load a shop, don't remove its items.** Keep them and say "couldn't verify <shop>" in `status`.

Round ex-moms prices to whole kronor and set `"approx": true` when you derived them by ÷ 1.25.

## Steps

1. **Re-check every item in `items`** by opening its `url`:
   - Price changed → update `price_ex` / `price_incl`.
   - Sold out or page gone → remove it, and add "**Model** (shop, price): sold out (YYYY-MM-DD)" to `dropped`.
   - Condition grade or VMB status changed → update it, or drop it if it no longer meets the requirements.
2. **Scan the sources** for candidates that meet the hard requirements.
3. **Decide what earns a place.** Each item must be the best at least one of these **roles**:
   - Cheapest overall
   - Best value ThinkPad: cheapest 12th-gen-or-newer in top condition
   - Best ThinkPad: premium 14", light, good condition (currently X1 Carbon G10, U-series, Mycket bra)
   - Cheapest Mac
   - Best value Mac: M2 or newer Air, good condition, cheapest
   - Safest used Air: warranty or battery guarantee
   - Best screen Mac: 14" Pro
   - **Deal alert:** any M3/M4/M5 Air 13" with 16 GB / 512 GB+ under **9,000 kr ex moms**. Always add these, with `"pick": "Deal alert"`.

   If a candidate does a role better (cheaper with equal-or-better specs and condition, or same price with clearly better specs or condition), it replaces the current holder. Move the old one to `dropped` with a one-line reason. If an item no longer wins any role, drop it.
4. **Picks:** exactly three items get `pick`: "Best ThinkPad", "Best value" (cheapest top-condition 12th-gen+ ThinkPad) and "Best value Mac", each with a one-sentence `pick_text`. Add any "Deal alert" picks on top of those.
5. **`new_reference`:** the cheapest new MacBook Air 13" M5 with 16 GB / 512 GB at a shop that sells to companies. Update its price and shop.
6. **Refresh `private`** (the hand-picked Blocket/Tradera listings). Open each item's `url` with `curl -sL -A "Mozilla/5.0"`:
   - **Blocket:** if the page returns 404 or "Sidan hittades inte", or the raw HTML contains the word `Såld`, the item is gone. Remove it and add "**Model** (Blocket, price, area): sold (D Mon)" (or "listing removed") to the front of `private.skipped`. Otherwise update `price` if the listed price changed.
   - **Tradera:** read the current bid (the number after "Ledande bud") and the end time ("Slutar …"). Update `price_label` to "X kr bid (Y with buyer protection)", using both numbers from the page. Once an auction has ended, remove the item and add "**Model** (Tradera): ended at X kr (D Mon)" to the front of `private.skipped`.
   - If a bid has gone above the ceiling written in the item's `why`, add " Bid is now over the ceiling." to the end of its `flag`, unless it's already there.
   - Set `private.checked` to today. Mention private changes in `status` and `changes` like any other change.
   - **Don't add new private listings, and don't rewrite `why`, `note` or `sold`.** Those stay hand-picked.
7. **Bookkeeping:**
   - `checked` = today's date in Europe/Stockholm (YYYY-MM-DD).
   - `status` = one short sentence about today, e.g. "Checked all 5 shops, no changes." or "Reuseit M2 Air dropped 400 kr; couldn't verify Inet."
   - Add one entry to the front of `changes` (`{date, text}`) **only if something changed**. Keep the 30 newest.
   - Keep `dropped` to the 20 most useful entries, newest reasons first.
   - Order `items`: ThinkPads by price, then Macs by price. Set `highlight: true` on the picks.
8. **Style:** plain English, short. Each `why` starts with its role in bold (`**Best value Mac.** …`). Only `**bold**` markup is allowed; no HTML.
9. **Validate and publish:**
   - `python3 -m json.tool laptops.json > /dev/null` must pass.
   - If anything changed (including `checked`), commit to `main` with the message `Daily laptop check YYYY-MM-DD` and push. If the push is rejected, `git pull --rebase` and push again.
   - Don't edit any other file.

## Don't

- Don't invent prices or stock. If unsure, leave the item as it is and say so in `status`.
- Don't add anything that fails a hard requirement, however cheap it is.
- Don't change the requirements or roles. Only the buyer changes those, by editing this file.
- Don't add or re-rank `private` listings. That list is hand-picked, kept separately because private sellers can't give a moms invoice. Only refresh it as described in step 6.
