/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║                    THE CELLAR — Wine Collection Manager         ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║                                                                  ║
 * ║  A personal wine cellar management application.                  ║
 * ║                                                                  ║
 * ║  FEATURES:                                                       ║
 * ║  • Two databases: Active Cellar + Consumed Wines                 ║
 * ║  • Auto-calculated "Ready to Drink" from drinking window         ║
 * ║  • Price tracking with avg price & total cellar value stats      ║
 * ║  • AI Sommelier (Claude API) — analyzes collection & advises     ║
 * ║  • Search, filter by color/ready status, sort by any column      ║
 * ║  • CSV import/export                                             ║
 * ║  • Grape variety breakdown with normalization                    ║
 * ║  • Stats dashboard: color, country, grape distributions          ║
 * ║  • Persistent storage across sessions                            ║
 * ║                                                                  ║
 * ║  DESIGN: Minimalist editorial — white/grey/black palette,        ║
 * ║  Cormorant Garamond serif + Outfit sans-serif typography.        ║
 * ║                                                                  ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { useState, useEffect, useRef, useMemo, useCallback } from "react";

/* ════════════════════════════════════════════════════════════════════
   SECTION 1: PRE-LOADED CELLAR DATA
   ────────────────────────────────────────────────────────────────────
   Initial wine inventory loaded from the user's CSV file.
   This data seeds the cellar on first launch only — after that,
   all data lives in persistent storage and survives between sessions.
   
   Each bottle object contains:
   - id:          Unique identifier
   - amount:      Number of bottles of this wine
   - name:        Wine name / label
   - region:      Wine region (free text — supports any region)
   - country:     Country of origin (free text — supports any country)
   - grape:       Grape variety or blend description
   - color:       Wine color category (Red, White, Rosé, Sparkling, Sweet, Orange)
   - vintage:     Year of harvest, or "NV" for non-vintage
   - windowStart: Drinking window start year
   - windowEnd:   Drinking window end year
   - ready:       Manual fallback for "ready to drink" (used only when no window data)
   - notes:       Free text notes (tasting notes, provenance, etc.)
   - price:       Price per bottle (free text, typically in ₪)
   ════════════════════════════════════════════════════════════════════ */
const INITIAL_CELLAR = [
  { id: "b1",  amount: 2, name: "Bordeaux Clarendelle",                          region: "Bordeaux",              country: "France",   grape: "Merlot",                                    color: "Red",      vintage: "2016", windowStart: "2025", windowEnd: "2026", ready: true,  notes: "",              price: "" },
  { id: "b2",  amount: 2, name: "Vacheron Le Rosé",                              region: "Sancerre",              country: "France",   grape: "Pinot Noir",                                color: "Rosé",     vintage: "2021", windowStart: "2025", windowEnd: "2027", ready: true,  notes: "",              price: "" },
  { id: "b3",  amount: 1, name: "Du Guéret",                                     region: "Beaujolais",            country: "France",   grape: "Gamay",                                     color: "Red",      vintage: "2023", windowStart: "2025", windowEnd: "2025", ready: true,  notes: "",              price: "" },
  { id: "b4",  amount: 3, name: "Château Daugay Saint-Émilion G.C.",             region: "Saint-Émilion",         country: "France",   grape: "Merlot based",                              color: "Red",      vintage: "2021", windowStart: "2027", windowEnd: "2031", ready: false, notes: "",              price: "" },
  { id: "b5",  amount: 1, name: "Pelach Winery — Shira",                         region: "Western Galilee",       country: "Israel",   grape: "Carignan",                                  color: "Red",      vintage: "2022", windowStart: "2025", windowEnd: "2026", ready: true,  notes: "",              price: "" },
  { id: "b6",  amount: 1, name: "Flam White Label",                              region: "Judean Hills",          country: "Israel",   grape: "C.S, Petit Verdot, Syrah",                  color: "Red",      vintage: "2022", windowStart: "2025", windowEnd: "2029", ready: true,  notes: "",              price: "" },
  { id: "b7",  amount: 1, name: "Cordero di Montezemolo BROLO",                  region: "Barolo",                country: "Italy",    grape: "Nebbiolo",                                  color: "Red",      vintage: "2020", windowStart: "2026", windowEnd: "2030", ready: true,  notes: "",              price: "" },
  { id: "b8",  amount: 1, name: "Georges Duboeuf — Moulin-à-Vent",              region: "Beaujolais",            country: "France",   grape: "Gamay",                                     color: "Red",      vintage: "2020", windowStart: "2025", windowEnd: "2027", ready: true,  notes: "",              price: "" },
  { id: "b9",  amount: 1, name: "Somek Syrah",                                   region: "HaCarmel",              country: "Israel",   grape: "Syrah",                                     color: "Red",      vintage: "2018", windowStart: "2025", windowEnd: "2026", ready: true,  notes: "",              price: "" },
  { id: "b10", amount: 2, name: "Somek Carignan",                                region: "HaCarmel",              country: "Israel",   grape: "Carignan",                                  color: "Red",      vintage: "2018", windowStart: "2025", windowEnd: "2026", ready: true,  notes: "",              price: "" },
  { id: "b11", amount: 1, name: "Famille J.M. Cazes Pauillac",                   region: "Pauillac",              country: "France",   grape: "Left Bank blend",                           color: "Red",      vintage: "2018", windowStart: "2026", windowEnd: "2030", ready: true,  notes: "",              price: "" },
  { id: "b12", amount: 1, name: "L'Enchanteur de Vray Croix de Gay",             region: "Pomerol",               country: "France",   grape: "Right Bank blend",                          color: "Red",      vintage: "2017", windowStart: "2025", windowEnd: "2032", ready: true,  notes: "",              price: "" },
  { id: "b13", amount: 1, name: "Magari — Gaja Ca'Marcanda",                     region: "Tuscany",               country: "Italy",    grape: "Merlot, C.S, Cabernet Franc",               color: "Red",      vintage: "2020", windowStart: "2027", windowEnd: "2032", ready: false, notes: "",              price: "" },
  { id: "b14", amount: 1, name: "Shoresh Tzora — Red",                           region: "Judean Hills",          country: "Israel",   grape: "Syrah, C.S and more",                       color: "Red",      vintage: "2020", windowStart: "2026", windowEnd: "2028", ready: true,  notes: "",              price: "" },
  { id: "b15", amount: 1, name: "Shoresh Tzora — White",                         region: "Judean Hills",          country: "Israel",   grape: "Sauvignon Blanc, Chardonnay",               color: "White",    vintage: "2022", windowStart: "2026", windowEnd: "2029", ready: true,  notes: "",              price: "" },
  { id: "b16", amount: 1, name: "Blanc du Castel",                               region: "Judean Hills",          country: "Israel",   grape: "Chardonnay",                                color: "White",    vintage: "2022", windowStart: "2030", windowEnd: "2030", ready: false, notes: "",              price: "" },
  { id: "b17", amount: 1, name: "Castel",                                        region: "Judean Hills",          country: "Israel",   grape: "Cab, Merlot, Petit Verdot",                 color: "Red",      vintage: "2018", windowStart: "2025", windowEnd: "2028", ready: true,  notes: "",              price: "" },
  { id: "b18", amount: 3, name: "Grand Vin Castel",                              region: "Judean Hills",          country: "Israel",   grape: "Left Bank blend",                           color: "Red",      vintage: "2020", windowStart: "2028", windowEnd: "2033", ready: false, notes: "",              price: "" },
  { id: "b19", amount: 1, name: "Maypotpatano",                                  region: "Santorini",             country: "Greece",   grape: "Unknown",                                   color: "Red",      vintage: "2019", windowStart: "2025", windowEnd: "2029", ready: true,  notes: "",              price: "" },
  { id: "b20", amount: 1, name: "Cervaro della Sala Antinori",                   region: "Umbria",                country: "Italy",    grape: "Chardonnay",                                color: "White",    vintage: "2019", windowStart: "2027", windowEnd: "2031", ready: false, notes: "",              price: "" },
  { id: "b21", amount: 1, name: "Château Gravet Renaissance Saint-Émilion G.C.", region: "Saint-Émilion",         country: "France",   grape: "Right Bank blend",                          color: "Red",      vintage: "2018", windowStart: "2026", windowEnd: "2032", ready: true,  notes: "",              price: "" },
  { id: "b22", amount: 1, name: "Clos Beauregard Pomerol",                       region: "Pomerol",               country: "France",   grape: "Right Bank blend",                          color: "Red",      vintage: "2016", windowStart: "2025", windowEnd: "2030", ready: true,  notes: "",              price: "" },
  { id: "b23", amount: 1, name: "Amarone Tommasi della Valpolicella",            region: "Valpolicella",          country: "Italy",    grape: "Corvina",                                   color: "Red",      vintage: "2018", windowStart: "2026", windowEnd: "2030", ready: true,  notes: "",              price: "" },
  { id: "b24", amount: 1, name: "Banfi Brunello di Montalcino",                  region: "Montalcino",            country: "Italy",    grape: "Sangiovese",                                color: "Red",      vintage: "2016", windowStart: "2026", windowEnd: "2030", ready: true,  notes: "",              price: "" },
  { id: "b25", amount: 1, name: "Otima 10 Port",                                 region: "Port",                  country: "Portugal", grape: "Unknown",                                   color: "Sweet",    vintage: "NV",   windowStart: "2025", windowEnd: "2030", ready: true,  notes: "",              price: "" },
  { id: "b26", amount: 1, name: "Château Chasse-Spleen",                         region: "Moulis-en-Médoc",       country: "France",   grape: "Left Bank blend",                           color: "Red",      vintage: "2011", windowStart: "2025", windowEnd: "2026", ready: true,  notes: "",              price: "" },
  { id: "b27", amount: 1, name: "Clos de Gat Ayalon Valley",                     region: "Judean Hills",          country: "Israel",   grape: "Left Bank blend",                           color: "Red",      vintage: "2014", windowStart: "2026", windowEnd: "2032", ready: true,  notes: "",              price: "" },
  { id: "b28", amount: 1, name: "Grand Vin Castel",                              region: "Judean Hills",          country: "Israel",   grape: "Left Bank blend",                           color: "Red",      vintage: "2018", windowStart: "2026", windowEnd: "2031", ready: true,  notes: "",              price: "" },
  { id: "b29", amount: 1, name: "Grand Vin Castel",                              region: "Judean Hills",          country: "Israel",   grape: "Left Bank blend",                           color: "Red",      vintage: "2019", windowStart: "2029", windowEnd: "2035", ready: false, notes: "",              price: "" },
  { id: "b30", amount: 1, name: "Sycra Syrah — Clos de Gat",                     region: "Judean Hills",          country: "Israel",   grape: "Syrah",                                     color: "Red",      vintage: "2016", windowStart: "2025", windowEnd: "2030", ready: true,  notes: "",              price: "" },
  { id: "b31", amount: 1, name: "Sphera White Signature",                        region: "Judean Hills",          country: "Israel",   grape: "Unknown",                                   color: "White",    vintage: "2020", windowStart: "2025", windowEnd: "2027", ready: true,  notes: "",              price: "" },
  { id: "b32", amount: 1, name: "Yarden ROM",                                    region: "Golan Heights",         country: "Israel",   grape: "C.S, Syrah, Merlot",                        color: "Red",      vintage: "2013", windowStart: "2026", windowEnd: "2029", ready: true,  notes: "",              price: "" },
  { id: "b33", amount: 1, name: "Yarden Katzrin",                                region: "Golan Heights",         country: "Israel",   grape: "C.S, Merlot, Malbec",                       color: "Red",      vintage: "2017", windowStart: "2027", windowEnd: "2030", ready: false, notes: "",              price: "" },
  { id: "b34", amount: 1, name: "Raziel",                                        region: "Judean Hills",          country: "Israel",   grape: "Syrah, Carignan",                           color: "Red",      vintage: "2018", windowStart: "2026", windowEnd: "2026", ready: true,  notes: "",              price: "" },
  { id: "b35", amount: 1, name: "Ramat Negev Exodus",                            region: "Negev",                 country: "Israel",   grape: "Malbec, Petit Verdot",                      color: "Red",      vintage: "2017", windowStart: "2026", windowEnd: "2030", ready: true,  notes: "",              price: "" },
  { id: "b36", amount: 1, name: "Flam Nobel",                                    region: "Judean Hills",          country: "Israel",   grape: "C.S, Syrah, Petit Verdot",                  color: "Red",      vintage: "2018", windowStart: "2026", windowEnd: "2028", ready: true,  notes: "",              price: "" },
  { id: "b37", amount: 2, name: "Misty Hills — Tzora",                           region: "Judean Hills",          country: "Israel",   grape: "C.S, Syrah",                                color: "Red",      vintage: "2019", windowStart: "2027", windowEnd: "2030", ready: false, notes: "",              price: "" },
  { id: "b38", amount: 1, name: "Alpha Omega — Jacob Uria",                      region: "Judean Hills",          country: "Israel",   grape: "Gewürztraminer",                            color: "Sweet",    vintage: "2022", windowStart: "2028", windowEnd: "2032", ready: false, notes: "",              price: "" },
  { id: "b39", amount: 1, name: "Muscat de Castel",                              region: "Judean Hills",          country: "Israel",   grape: "Muscat",                                    color: "Sweet",    vintage: "2018", windowStart: "2026", windowEnd: "2030", ready: true,  notes: "",              price: "" },
  { id: "b40", amount: 2, name: "Ladoix Récolte du Domaine",                     region: "Burgundy",              country: "France",   grape: "Pinot Noir",                                color: "Red",      vintage: "2020", windowStart: "2026", windowEnd: "2028", ready: true,  notes: "",              price: "" },
  { id: "b41", amount: 2, name: "Cornas Ferraton Père & Fils",                   region: "Rhône Valley",          country: "France",   grape: "Syrah",                                     color: "Red",      vintage: "2021", windowStart: "2027", windowEnd: "2030", ready: false, notes: "",              price: "" },
  { id: "b42", amount: 1, name: "Pessac-Léognan Château Haut-Lagrange",          region: "Bordeaux",              country: "France",   grape: "Merlot, C.S",                               color: "Red",      vintage: "2019", windowStart: "2027", windowEnd: "2032", ready: false, notes: "",              price: "" },
  { id: "b43", amount: 1, name: "Pessac-Léognan Château Haut-Lagrange",          region: "Bordeaux",              country: "France",   grape: "Merlot, C.S",                               color: "Red",      vintage: "2017", windowStart: "2025", windowEnd: "2030", ready: true,  notes: "",              price: "" },
  { id: "b44", amount: 1, name: "Hevron Heights Armageddon",                     region: "Hevron",                country: "Israel",   grape: "Merlot, Syrah, C.S",                        color: "Red",      vintage: "2016", windowStart: "2025", windowEnd: "2028", ready: true,  notes: "",              price: "" },
  { id: "b45", amount: 1, name: "Saint-Émilion G.C. Moulin Galhaud",             region: "Saint-Émilion",         country: "France",   grape: "Right Bank blend",                          color: "Red",      vintage: "2014", windowStart: "2025", windowEnd: "2030", ready: true,  notes: "",              price: "" },
  { id: "b46", amount: 1, name: "Magnum — Clos de Gat Chardonnay",               region: "Judean Hills",          country: "Israel",   grape: "Chardonnay",                                color: "White",    vintage: "2012", windowStart: "2025", windowEnd: "2026", ready: true,  notes: "Magnum",        price: "" },
  { id: "b47", amount: 1, name: "Magnum — Clos de Gat Ayalon Valley",            region: "Judean Hills",          country: "Israel",   grape: "Left Bank blend",                           color: "Red",      vintage: "2013", windowStart: "2028", windowEnd: "2032", ready: false, notes: "Magnum",        price: "" },
  { id: "b48", amount: 1, name: "Magnum — Château Tauzinat",                     region: "Saint-Émilion",         country: "France",   grape: "Right Bank blend",                          color: "Red",      vintage: "2017", windowStart: "2028", windowEnd: "2032", ready: false, notes: "Magnum",        price: "" },
  { id: "b49", amount: 1, name: "Magnum — Guigal Côtes du Rhône",                region: "Rhône Valley",          country: "France",   grape: "Côtes du Rhône blend",                      color: "Red",      vintage: "2021", windowStart: "2025", windowEnd: "2028", ready: true,  notes: "Magnum",        price: "" },
  { id: "b50", amount: 2, name: "Magnum — Château Golan Geshem Varod",           region: "Golan Heights",         country: "Israel",   grape: "Grenache",                                  color: "Rosé",     vintage: "2022", windowStart: "2025", windowEnd: "2026", ready: true,  notes: "Magnum",        price: "" },
  { id: "b51", amount: 2, name: "Trimbach Pinot Gris",                           region: "Alsace",                country: "France",   grape: "Pinot Gris",                                color: "White",    vintage: "2017", windowStart: "2025", windowEnd: "2027", ready: true,  notes: "",              price: "" },
  { id: "b52", amount: 1, name: "Trimbach Riesling",                             region: "Alsace",                country: "France",   grape: "Riesling",                                  color: "White",    vintage: "2015", windowStart: "2025", windowEnd: "2026", ready: true,  notes: "",              price: "" },
  { id: "b53", amount: 1, name: "Château Lespault-Martillac Blanc",              region: "Pessac-Léognan",        country: "France",   grape: "Sauvignon, Sémillon",                       color: "White",    vintage: "2017", windowStart: "2025", windowEnd: "2027", ready: true,  notes: "",              price: "" },
  { id: "b54", amount: 1, name: "Domaine de la Solitude",                        region: "Pessac-Léognan",        country: "France",   grape: "50/50 Merlot, C.S",                         color: "Red",      vintage: "2014", windowStart: "2025", windowEnd: "2028", ready: true,  notes: "",              price: "" },
  { id: "b55", amount: 1, name: "Domaine de la Solitude",                        region: "Pessac-Léognan",        country: "France",   grape: "Merlot, Cabernet Franc",                    color: "Red",      vintage: "2018", windowStart: "2027", windowEnd: "2030", ready: false, notes: "",              price: "" },
  { id: "b56", amount: 1, name: "Château Lespault-Martillac Rouge",              region: "Pessac-Léognan",        country: "France",   grape: "Right Bank blend",                          color: "Red",      vintage: "2017", windowStart: "2025", windowEnd: "2029", ready: true,  notes: "",              price: "" },
  { id: "b57", amount: 2, name: "Léor de Vignelaure",                            region: "Rhône Valley",          country: "France",   grape: "Sauvignon Blanc",                           color: "Sweet",    vintage: "2022", windowStart: "2025", windowEnd: "2032", ready: true,  notes: "",              price: "" },
  { id: "b58", amount: 1, name: "Château La Grave",                              region: "Sainte-Croix-du-Mont",  country: "France",   grape: "",                                          color: "Sweet",    vintage: "2010", windowStart: "2025", windowEnd: "2028", ready: true,  notes: "",              price: "" },
  { id: "b59", amount: 1, name: "Clos des Lunes — Lune d'Argent",               region: "Bordeaux",              country: "France",   grape: "Sémillon, Sauvignon",                       color: "White",    vintage: "2018", windowStart: "2025", windowEnd: "2027", ready: true,  notes: "",              price: "" },
  { id: "b60", amount: 1, name: "Clos des Lunes — Lune d'Argent",               region: "Bordeaux",              country: "France",   grape: "Sémillon, Sauvignon",                       color: "White",    vintage: "2020", windowStart: "2026", windowEnd: "2029", ready: true,  notes: "",              price: "" },
  { id: "b61", amount: 1, name: "William Fèvre Chablis Vaulorent",              region: "Chablis",               country: "France",   grape: "Chardonnay",                                color: "White",    vintage: "2019", windowStart: "2025", windowEnd: "2027", ready: true,  notes: "",              price: "" },
  { id: "b62", amount: 1, name: "William Fèvre Chablis Vaulorent",              region: "Chablis",               country: "France",   grape: "Chardonnay",                                color: "White",    vintage: "2020", windowStart: "2025", windowEnd: "2028", ready: true,  notes: "",              price: "" },
  { id: "b63", amount: 2, name: "Savigny-lès-Beaune",                           region: "Burgundy",              country: "France",   grape: "Chardonnay",                                color: "White",    vintage: "2020", windowStart: "2025", windowEnd: "2027", ready: true,  notes: "",              price: "" },
  { id: "b64", amount: 1, name: "5L Kitron C.S",                                 region: "North Israel",          country: "Israel",   grape: "Cabernet Sauvignon",                        color: "Red",      vintage: "2016", windowStart: "2028", windowEnd: "2032", ready: false, notes: "5L bottle",     price: "" },
  { id: "b65", amount: 3, name: "Bollinger Champagne",                           region: "Champagne",             country: "France",   grape: "Pinot Noir, Chardonnay",                    color: "Sparkling",vintage: "NV",   windowStart: "2025", windowEnd: "2029", ready: true,  notes: "",              price: "" },
  { id: "b66", amount: 1, name: "Raziel Rosé Sparkling",                         region: "Judean Hills",          country: "Israel",   grape: "Pinot Noir, Chardonnay",                    color: "Sparkling",vintage: "NV",   windowStart: "2025", windowEnd: "2028", ready: true,  notes: "",              price: "" },
  { id: "b67", amount: 1, name: "Raziel Rosé Sparkling",                         region: "Judean Hills",          country: "Israel",   grape: "Chardonnay, Pinot Noir",                    color: "Sparkling",vintage: "NV",   windowStart: "2025", windowEnd: "2028", ready: true,  notes: "",              price: "" },
  { id: "b68", amount: 4, name: "A. Buffa Rosé Petit Verdot",                    region: "Judean Hills",          country: "Israel",   grape: "Petit Verdot",                              color: "Sparkling",vintage: "2021", windowStart: "2025", windowEnd: "2027", ready: true,  notes: "",              price: "" },
  { id: "b69", amount: 2, name: "A. Buffa White",                                region: "Judean Hills",          country: "Israel",   grape: "Pinotage",                                  color: "Sparkling",vintage: "2021", windowStart: "2025", windowEnd: "2027", ready: true,  notes: "",              price: "" },
  { id: "b70", amount: 1, name: "Sphera Blanc de Blancs",                        region: "Judean Hills",          country: "Israel",   grape: "Unknown",                                   color: "Sparkling",vintage: "2018", windowStart: "2025", windowEnd: "2027", ready: true,  notes: "",              price: "" },
  { id: "b71", amount: 2, name: "Moët & Chandon Brut Impérial",                 region: "Champagne",             country: "France",   grape: "Pinot Noir, Chardonnay",                    color: "Sparkling",vintage: "NV",   windowStart: "2025", windowEnd: "2028", ready: true,  notes: "",              price: "" },
  { id: "b72", amount: 1, name: "Veuve Clicquot Rosé",                          region: "Champagne",             country: "France",   grape: "Pinot Noir, Chardonnay",                    color: "Sparkling",vintage: "NV",   windowStart: "2025", windowEnd: "2028", ready: true,  notes: "",              price: "" },
  { id: "b73", amount: 1, name: "Veuve Clicquot Brut",                           region: "Champagne",             country: "France",   grape: "Pinot Noir, Chardonnay",                    color: "Sparkling",vintage: "NV",   windowStart: "2025", windowEnd: "2028", ready: true,  notes: "",              price: "" },
  { id: "b74", amount: 1, name: "Laurent-Perrier Rosé",                         region: "Champagne",             country: "France",   grape: "Pinot Noir, Chardonnay",                    color: "Sparkling",vintage: "NV",   windowStart: "2025", windowEnd: "2030", ready: true,  notes: "",              price: "" },
  { id: "b75", amount: 1, name: "Jacob Uria — A Spark in Darkness",              region: "Judean Hills",          country: "Israel",   grape: "Blanc de Noir",                             color: "Sparkling",vintage: "2017", windowStart: "2025", windowEnd: "2027", ready: true,  notes: "",              price: "" },
  { id: "b76", amount: 1, name: "Goumenissa — Domaine Tatsis",                   region: "Macedonia",             country: "Greece",   grape: "Xinomavro, Negoska",                        color: "Red",      vintage: "2015", windowStart: "2025", windowEnd: "2026", ready: true,  notes: "",              price: "" },
  { id: "b77", amount: 1, name: "Amethystos White — Blanc",                      region: "Macedonia",             country: "Greece",   grape: "Sauvignon Blanc, Assyrtiko",                color: "White",    vintage: "2023", windowStart: "2025", windowEnd: "2026", ready: true,  notes: "",              price: "" },
  { id: "b78", amount: 1, name: "Bollinger PN TX20",                             region: "Champagne",             country: "France",   grape: "Pinot Noir",                                color: "Sparkling",vintage: "NV",   windowStart: "2025", windowEnd: "2035", ready: true,  notes: "Mom's collection", price: "" },
  { id: "b79", amount: 1, name: "Bollinger Rosé",                               region: "Champagne",             country: "France",   grape: "Pinot Noir, Chardonnay, Pinot Meunier",     color: "Sparkling",vintage: "NV",   windowStart: "2025", windowEnd: "2029", ready: true,  notes: "Mom's collection", price: "" },
  { id: "b80", amount: 1, name: "Zind-Humbrecht Pinot Gris Grand Cru Rangen",   region: "Alsace",                country: "France",   grape: "Pinot Gris",                                color: "White",    vintage: "2017", windowStart: "2026", windowEnd: "2036", ready: true,  notes: "Mom's collection", price: "" },
  { id: "b81", amount: 1, name: "Trimbach Pinot Noir Cuvée 7",                  region: "Alsace",                country: "France",   grape: "Pinot Noir",                                color: "Red",      vintage: "2020", windowStart: "2025", windowEnd: "2028", ready: true,  notes: "",              price: "" },
  { id: "b82", amount: 1, name: "Cyprien Arlaud 'Scritch' Chablis",              region: "Chablis",               country: "France",   grape: "Chardonnay",                                color: "White",    vintage: "2023", windowStart: "2025", windowEnd: "2030", ready: true,  notes: "Organic",       price: "" },
  { id: "b83", amount: 1, name: "Château Tauzinat L'Hermitage",                 region: "Saint-Émilion Grand Cru",country: "France",  grape: "85% Merlot, 15% C.F",                       color: "Red",      vintage: "2020", windowStart: "2026", windowEnd: "2032", ready: true,  notes: "",              price: "" },
  { id: "b84", amount: 1, name: "Château Taillefer",                            region: "Pomerol",               country: "France",   grape: "Merlot, touch of C.F",                      color: "Red",      vintage: "2018", windowStart: "2026", windowEnd: "2032", ready: true,  notes: "",              price: "" },
  { id: "b85", amount: 1, name: "Domaine de la Solitude",                        region: "Pessac-Léognan",        country: "France",   grape: "50/50 Merlot, C.S",                         color: "Red",      vintage: "2018", windowStart: "2027", windowEnd: "2035", ready: false, notes: "",              price: "" },
  { id: "b86", amount: 1, name: "Château Lespault-Martillac Blanc",             region: "Pessac-Léognan",        country: "France",   grape: "Sauvignon, Sémillon",                       color: "White",    vintage: "2016", windowStart: "2025", windowEnd: "2030", ready: true,  notes: "",              price: "" },
  { id: "b87", amount: 1, name: "Domaine de la Solitude Rouge",                  region: "Pessac-Léognan",        country: "France",   grape: "60% C.S, 35% Merlot, 5% Petit Verdot",     color: "Red",      vintage: "2023", windowStart: "2025", windowEnd: "2030", ready: true,  notes: "",              price: "" },
  { id: "b88", amount: 1, name: "Domaine des Marrans Fleurie Clos du Pavillon",  region: "Fleurie",               country: "France",   grape: "Gamay",                                     color: "Red",      vintage: "2021", windowStart: "2025", windowEnd: "2027", ready: true,  notes: "",              price: "" },
  { id: "b89", amount: 1, name: "Domaine des Marrans Fleurie 'Les Marrans'",     region: "Fleurie",               country: "France",   grape: "Gamay",                                     color: "Red",      vintage: "2022", windowStart: "2025", windowEnd: "2027", ready: true,  notes: "",              price: "" },
  { id: "b90", amount: 1, name: "Château Roslane Premier Cru Blanc",            region: "Atlas",                 country: "Morocco",  grape: "Chardonnay",                                color: "White",    vintage: "2021", windowStart: "2025", windowEnd: "2028", ready: true,  notes: "",              price: "" },
  { id: "b91", amount: 1, name: "C'est le Printemps — Dard et Ribo",            region: "Crozes-Hermitage",      country: "France",   grape: "Syrah",                                     color: "White",    vintage: "2023", windowStart: "2025", windowEnd: "2028", ready: true,  notes: "",              price: "" },
  { id: "b92", amount: 1, name: "Domaine de Sulauze 'Chapelle Laïque' Rouge",   region: "Provence",              country: "France",   grape: "Cinsault",                                  color: "Red",      vintage: "2023", windowStart: "2025", windowEnd: "2028", ready: true,  notes: "",              price: "" },
  { id: "b93", amount: 1, name: "Domaine de Sulauze Charbonnière",              region: "Provence",              country: "France",   grape: "Grenache, Syrah",                           color: "Red",      vintage: "2023", windowStart: "2025", windowEnd: "2028", ready: true,  notes: "",              price: "" },
  { id: "b94", amount: 1, name: "COS Cerasuolo di Vittoria",                     region: "Sicily",                country: "Italy",    grape: "Nero d'Avola, Frappato",                    color: "Red",      vintage: "2021", windowStart: "2026", windowEnd: "2030", ready: true,  notes: "",              price: "" },
  { id: "b95", amount: 4, name: "Beaujolais Nouveau — Georges Duboeuf '25",     region: "Beaujolais",            country: "France",   grape: "Gamay",                                     color: "Red",      vintage: "2025", windowStart: "2026", windowEnd: "2026", ready: true,  notes: "",              price: "" },
  { id: "b96", amount: 1, name: "Raziel Blanc",                                  region: "Judean Hills",          country: "Israel",   grape: "Roussanne, Viognier",                       color: "White",    vintage: "2024", windowStart: "2026", windowEnd: "2026", ready: true,  notes: "",              price: "" },
  { id: "b97", amount: 1, name: "Guerrieri Rizzardi Amarone 3 Cru",              region: "Valpolicella",          country: "Italy",    grape: "Corvina",                                   color: "Red",      vintage: "2020", windowStart: "2028", windowEnd: "2028", ready: false, notes: "",              price: "" },
  { id: "b98", amount: 1, name: "Claus Preisinger Puszta Libre",                 region: "Burgenland",            country: "Austria",  grape: "50% Pinot Noir, 50% St. Laurent",           color: "Red",      vintage: "2023", windowStart: "2026", windowEnd: "2026", ready: true,  notes: "",              price: "" },
  { id: "b99", amount: 2, name: "Magnum — Le Sabbie dell'Etna Firriato",        region: "Etna",                  country: "Italy",    grape: "Nerello Mascalese",                         color: "Red",      vintage: "2021", windowStart: "2026", windowEnd: "2028", ready: true,  notes: "Magnum",        price: "" },
  { id: "b100",amount: 1, name: "Torre Zambra Incastro Bianco",                  region: "Abruzzo",               country: "Italy",    grape: "Pecorino, Passerina, Trebbiano",            color: "White",    vintage: "2024", windowStart: "2026", windowEnd: "2028", ready: true,  notes: "",              price: "" },
];


/* ════════════════════════════════════════════════════════════════════
   SECTION 2: CONSTANTS & UTILITY FUNCTIONS
   ════════════════════════════════════════════════════════════════════ */

/** Available wine color categories for filter chips and the form dropdown */
const COLOR_OPTIONS = ["Red", "White", "Rosé", "Sparkling", "Sweet", "Orange"];

/** Generates a short unique ID using timestamp + random suffix */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/** Creates a blank bottle object with default values; `overrides` merges on top */
const emptyBottle = (overrides = {}) => ({
  id: uid(),
  amount: 1,
  name: "",
  region: "",
  country: "",
  grape: "",
  color: "Red",
  vintage: String(new Date().getFullYear()),
  windowStart: "",
  windowEnd: "",
  ready: false,   // manual fallback — only used when no window data exists
  notes: "",
  price: "",
  ...overrides,
});

/**
 * AUTO-CALCULATED "READY TO DRINK" STATUS
 * ────────────────────────────────────────
 * Determines if a wine is ready to drink based on its drinking window
 * compared to the current year. Logic:
 * 
 *   - Both windowStart AND windowEnd set → ready if current year is within range
 *   - Only windowStart set → ready if current year >= start (open-ended window)
 *   - Only windowEnd set → ready if current year <= end
 *   - Neither set → falls back to the manual `ready` boolean on the bottle
 * 
 * This function is used everywhere: table display, filters, stats, CSV export,
 * and the AI Sommelier prompt.
 */
const CURRENT_YEAR = new Date().getFullYear();

function isReady(bottle) {
  const start = parseInt(bottle.windowStart);
  const end = parseInt(bottle.windowEnd);

  if (start && end)  return CURRENT_YEAR >= start && CURRENT_YEAR <= end;
  if (start && !end) return CURRENT_YEAR >= start;
  if (!start && end) return CURRENT_YEAR <= end;
  return bottle.ready; // no window data — use manual field
}

/**
 * Parses a price string into a numeric value.
 * Strips currency symbols (₪, $, €) and whitespace, returns NaN if invalid.
 * Used for calculating average price and total cellar value.
 */
function parsePrice(priceStr) {
  if (!priceStr) return NaN;
  const cleaned = String(priceStr).replace(/[₪$€,\s]/g, "").trim();
  return parseFloat(cleaned);
}


/* ════════════════════════════════════════════════════════════════════
   SECTION 3: PERSISTENT STORAGE
   ────────────────────────────────────────────────────────────────────
   Uses the Artifact persistent storage API (window.storage) to save
   and load data between sessions. Three keys:
   
   - "wc4"  → cellar array (active bottles)
   - "wc4c" → consumed array (drunk bottles with scores)
   - "wc4i" → boolean flag: has initial data been seeded?
   
   On first launch (init flag is false), we seed with INITIAL_CELLAR.
   After that, all reads come from storage.
   ════════════════════════════════════════════════════════════════════ */
const STORAGE_KEYS = {
  cellar: "wc4",      // active cellar data
  consumed: "wc4c",   // consumed wines data
  init: "wc4i",       // initialization flag
};

/** Load a value from persistent storage; returns null on failure or missing key */
async function loadFromStorage(key) {
  try {
    const result = await window.storage.get(key);
    return result ? JSON.parse(result.value) : null;
  } catch {
    return null;
  }
}

/** Save a value to persistent storage */
async function saveToStorage(key, data) {
  try {
    await window.storage.set(key, JSON.stringify(data));
  } catch (error) {
    console.error("Storage save failed:", error);
  }
}


/* ════════════════════════════════════════════════════════════════════
   SECTION 4: CSV IMPORT / EXPORT
   ────────────────────────────────────────────────────────────────────
   Export: Converts bottle array → CSV string (UTF-8 BOM for Excel).
   Import: Parses CSV text → array of bottle objects.
   
   CSV columns: Amount, Name, Region, Country, Grape, Color, Vintage,
   Window Start, Window End, Ready, Notes, Price [, Score for consumed]
   ════════════════════════════════════════════════════════════════════ */

/**
 * Converts an array of bottles to a CSV string.
 * @param {Array} bottles - Array of bottle objects
 * @param {boolean} includeScore - If true, adds a Score column (for consumed wines)
 * @returns {string} CSV content
 */
function bottlesToCSV(bottles, includeScore = false) {
  const headers = [
    "Amount", "Name", "Region", "Country", "Grape", "Color",
    "Vintage", "Window Start", "Window End", "Ready", "Notes", "Price",
  ];
  if (includeScore) headers.push("Score");

  const rows = bottles.map(b => {
    const values = [
      b.amount, b.name, b.region, b.country, b.grape, b.color,
      b.vintage, b.windowStart, b.windowEnd, isReady(b) ? "Yes" : "No",
      b.notes, b.price,
    ];
    if (includeScore) values.push(b.score || "");

    // Escape double quotes and wrap each value in quotes for safety
    return values.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Parses a CSV string into an array of bottle objects.
 * Handles quoted fields with commas inside them.
 * @param {string} text - Raw CSV text
 * @returns {Array} Array of bottle objects
 */
function csvToBottles(text) {
  const lines = text.split("\n").filter(line => line.trim());
  if (lines.length < 2) return []; // need at least headers + 1 data row

  return lines.slice(1).map(row => {
    // Parse CSV row respecting quoted fields
    const values = [];
    let current = "";
    let inQuotes = false;

    for (const char of row) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ""; }
      else current += char;
    }
    values.push(current.trim());

    return {
      ...emptyBottle(),
      amount: parseInt(values[0]) || 1,
      name: values[1] || "",
      region: values[2] || "",
      country: values[3] || "",
      grape: values[4] || "",
      color: values[5] || "Red",
      vintage: values[6] || "",
      windowStart: values[7] || "",
      windowEnd: values[8] || "",
      ready: (values[9] || "").toLowerCase() === "yes",
      notes: values[10] || "",
      price: values[11] || "",
    };
  });
}

/** Triggers a CSV file download in the browser */
function downloadCSV(content, filename) {
  const blob = new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}


/* ════════════════════════════════════════════════════════════════════
   SECTION 5: GRAPE ANALYSIS
   ────────────────────────────────────────────────────────────────────
   Normalizes grape variety names from free-text entries and counts
   occurrences across the cellar. Handles common abbreviations
   (C.S → Cabernet Sauvignon) and blend descriptions.
   ════════════════════════════════════════════════════════════════════ */

/**
 * Parses a grape/blend string into individual grape names.
 * Normalizes common abbreviations and removes percentages.
 * @param {string} grapeStr - Raw grape string like "C.S, Syrah, 15% Merlot"
 * @returns {string[]} Array of normalized grape names
 */
function parseGrapes(grapeStr) {
  if (!grapeStr || grapeStr === "Unknown") return [];

  const normalized = grapeStr
    .replace(/C\.S\.?/gi, "Cabernet Sauvignon")
    .replace(/C\.F\.?/gi, "Cabernet Franc")
    .replace(/\b(Left|Right) Bank blend\b/gi, "Bordeaux Blend")
    .replace(/Côtes du Rhône blend/gi, "Rhône Blend")
    .replace(/Blanc de Noir/gi, "Pinot Noir")
    .replace(/\b(based|and more|touch of)\b/gi, ",")
    .replace(/\d+%/g, ""); // strip percentages like "85%"

  return normalized
    .split(/[,&+]/)
    .map(g => {
      let trimmed = g.trim().replace(/^(mainly|about)\s+/i, "");
      if (!trimmed) return null;
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1); // title case
    })
    .filter(Boolean);
}

/**
 * Counts grape occurrences across all bottles (weighted by bottle amount).
 * @param {Array} cellar - Array of bottle objects
 * @returns {Array} Sorted array of [grapeName, count] pairs
 */
function getGrapeStats(cellar) {
  const counts = {};
  cellar.forEach(bottle => {
    const grapes = parseGrapes(bottle.grape);
    const amount = bottle.amount || 1;
    grapes.forEach(grape => {
      counts[grape] = (counts[grape] || 0) + amount;
    });
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}


/* ════════════════════════════════════════════════════════════════════
   SECTION 6: STYLESHEET
   ────────────────────────────────────────────────────────────────────
   Editorial minimalist design language:
   - Palette: pure white (#fff) with warm grey accents
   - Typography: Cormorant Garamond (serif, for wine names & headings)
                 + Outfit (sans-serif, for UI elements & body text)
   - Color badges use muted pastels matching wine color categories
   - All spacing and sizing follow an 8px grid
   ════════════════════════════════════════════════════════════════════ */
const STYLESHEET = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600&display=swap');

/* ── Reset & CSS Variables ── */
* { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --bg:   #ffffff;     /* primary background */
  --bg2:  #F8F8F7;     /* secondary background (table headers, hover) */
  --bdr:  #E8E6E1;     /* primary border color */
  --bdr2: #D4D1CC;     /* darker border for emphasis */
  --t1:   #1A1A18;     /* primary text — near-black */
  --t2:   #6B6963;     /* secondary text — medium grey */
  --t3:   #9C9890;     /* tertiary text — light grey */
  --red:  #8B2232;     /* accent: delete actions, error states */
  --grn:  #2D6A4F;     /* accent: "ready" badge */
  --sf:   'Cormorant Garamond', Georgia, serif;   /* serif font */
  --sn:   'Outfit', sans-serif;                    /* sans-serif font */
}

/* ── App Shell ── */
.wa { font-family: var(--sn); color: var(--t1); background: var(--bg); min-height: 100vh; }

/* ── Header ── */
.hd { border-bottom: 1px solid var(--bdr); padding: 0 40px; }
.hd-in { max-width: 1280px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 72px; }
.logo { font-family: var(--sf); font-size: 26px; font-weight: 600; letter-spacing: -0.02em; display: flex; align-items: center; gap: 10px; }
.logo-d { width: 7px; height: 7px; border-radius: 50%; background: var(--red); }

/* ── Navigation Pills ── */
.nav { display: flex; gap: 2px; background: var(--bg2); border-radius: 10px; padding: 3px; }
.nav b { padding: 8px 20px; border: none; border-radius: 8px; font-family: var(--sn); font-size: 13px; font-weight: 500; color: var(--t2); background: transparent; cursor: pointer; transition: .2s; }
.nav b.on { background: var(--bg); color: var(--t1); box-shadow: 0 1px 3px rgba(0,0,0,.06); }
.nav b:hover:not(.on) { color: var(--t1); }

/* ── Body Container ── */
.bd { max-width: 1280px; margin: 0 auto; padding: 28px 40px 80px; }

/* ── Toolbar (search + filter chips) ── */
.tb { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-bottom: 22px; }
.sr { flex: 1 1 240px; position: relative; }
.sr input { width: 100%; padding: 10px 14px 10px 38px; border: 1px solid var(--bdr); border-radius: 10px; font-family: var(--sn); font-size: 13px; color: var(--t1); background: var(--bg); outline: none; transition: .2s; }
.sr input:focus { border-color: var(--t3); }
.sr-i { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--t3); pointer-events: none; }

/* ── Filter Chips ── */
.ch { padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 500; border: 1px solid var(--bdr); background: var(--bg); color: var(--t2); cursor: pointer; transition: .15s; white-space: nowrap; font-family: var(--sn); }
.ch.on { background: var(--t1); color: #fff; border-color: var(--t1); }
.ch:hover:not(.on) { border-color: var(--t3); }

/* ── Buttons ── */
.bt { display: inline-flex; align-items: center; gap: 6px; padding: 9px 20px; border-radius: 10px; font-family: var(--sn); font-size: 13px; font-weight: 500; cursor: pointer; transition: .15s; white-space: nowrap; border: none; }
.bt-p { background: var(--t1); color: #fff; }
.bt-p:hover { background: #333; }
.bt-g { background: transparent; color: var(--t2); border: 1px solid var(--bdr); }
.bt-g:hover { border-color: var(--t3); color: var(--t1); }

/* ── Data Table ── */
.tw { overflow-x: auto; border: 1px solid var(--bdr); border-radius: 14px; background: var(--bg); }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { padding: 12px 16px; text-align: left; font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: var(--t3); border-bottom: 1px solid var(--bdr); background: var(--bg2); cursor: pointer; user-select: none; white-space: nowrap; }
th:hover { color: var(--t2); }
td { padding: 11px 16px; border-bottom: 1px solid #F2F0ED; vertical-align: middle; }
tbody tr:last-child td { border-bottom: none; }
tbody tr:hover { background: var(--bg2); }

/* ── Wine name styling in table ── */
.wn { font-family: var(--sf); font-size: 15px; font-weight: 600; letter-spacing: -0.01em; }

/* ── Color & Status Badges ── */
.bg { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 500; letter-spacing: .02em; }
.bg-r  { background: #FEF2F2; color: #991B1B; }   /* Red */
.bg-w  { background: #FEFCE8; color: #854D0E; }   /* White */
.bg-rs { background: #FFF1F2; color: #9F1239; }   /* Rosé */
.bg-sp { background: #F0FDF4; color: #166534; }   /* Sparkling */
.bg-sw { background: #FDF4FF; color: #7E22CE; }   /* Sweet */
.bg-o  { background: #FFF7ED; color: #C2410C; }   /* Orange */
.bg-y  { background: #F0FDF4; color: var(--grn); } /* Ready to drink */
.bg-n  { background: var(--bg2); color: var(--t3); } /* Not ready */

/* ── Icon Buttons (edit, delete, consume) ── */
.ib { background: none; border: none; cursor: pointer; padding: 5px; border-radius: 6px; color: var(--t3); display: flex; transition: .15s; }
.ib:hover { color: var(--t1); background: var(--bg2); }
.ib.dng:hover { color: var(--red); }

/* ── Modal Overlay & Container ── */
.ov { position: fixed; inset: 0; background: rgba(0,0,0,.25); backdrop-filter: blur(4px); z-index: 100; display: flex; align-items: center; justify-content: center; animation: fadeIn .15s; }
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
.md { background: var(--bg); border-radius: 18px; width: min(560px, 92vw); max-height: 88vh; overflow: auto; padding: 32px; box-shadow: 0 24px 64px rgba(0,0,0,.12); }
.md-t { font-family: var(--sf); font-size: 24px; font-weight: 600; letter-spacing: -0.02em; }

/* ── Form Layout ── */
.fg { display: grid; grid-template-columns: 1fr 1fr; gap: 16px 18px; }
.ff { grid-column: 1 / -1; }
.lb { display: block; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: .06em; color: var(--t3); margin-bottom: 6px; }
.ip, .sl, .ta { width: 100%; padding: 10px 12px; border: 1px solid var(--bdr); border-radius: 8px; font-family: var(--sn); font-size: 14px; color: var(--t1); background: var(--bg); outline: none; transition: .2s; }
.ip:focus, .sl:focus, .ta:focus { border-color: var(--t3); }
.sl { appearance: auto; }
.ta { resize: vertical; min-height: 56px; }
.fa { display: flex; gap: 10px; margin-top: 24px; }

/* ── Stats Cards Grid ── */
.sg { display: grid; grid-template-columns: repeat(auto-fit, minmax(155px, 1fr)); gap: 16px; margin-bottom: 28px; }
.st { background: var(--bg); border: 1px solid var(--bdr); border-radius: 14px; padding: 22px 20px; text-align: center; }
.sv { font-family: var(--sf); font-size: 32px; font-weight: 600; letter-spacing: -0.03em; }
.sl2 { font-size: 12px; color: var(--t3); margin-top: 4px; letter-spacing: .02em; }

/* ── Empty State ── */
.em { text-align: center; padding: 72px 20px; color: var(--t3); }
.em-i { font-size: 40px; margin-bottom: 14px; opacity: .5; }
.em-t { font-family: var(--sf); font-size: 20px; color: var(--t2); margin-bottom: 6px; }

/* ── Score Display ── */
.sc { font-family: var(--sf); font-size: 18px; font-weight: 700; }

/* ── Checkbox Label ── */
.ck { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; color: var(--t2); }
.ck input { width: 16px; height: 16px; accent-color: var(--t1); }

/* ── AI Loading Animation ── */
@keyframes pulse { 0%, 100% { transform: scale(1) } 50% { transform: scale(1.15) } }
.ai-pulse { animation: pulse 1.5s ease-in-out infinite; }

/* ── Responsive ── */
@media (max-width: 700px) {
  .hd { padding: 0 16px; }
  .hd-in { height: 60px; }
  .logo { font-size: 20px; }
  .bd { padding: 16px 16px 60px; }
  .fg { grid-template-columns: 1fr; }
  .nav b { padding: 6px 14px; font-size: 12px; }
  .md { padding: 20px; }
}
`;


/* ════════════════════════════════════════════════════════════════════
   SECTION 7: SVG ICONS
   ────────────────────────────────────────────────────────────────────
   Minimal inline SVG icons used throughout the UI.
   Each icon is a functional component rendering a 24x24 SVG.
   ════════════════════════════════════════════════════════════════════ */
const SvgIcon = ({ d, size = 16, strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={strokeWidth}
    strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);

const Icons = {
  plus:   <SvgIcon d={<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>} />,
  search: <SvgIcon d={<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>} />,
  edit:   <SvgIcon d={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>} />,
  trash:  <SvgIcon d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>} />,
  glass:  <SvgIcon d={<><path d="M6 2l-2 8a6 6 0 0 0 12 0L14 2"/><path d="M10 16v5"/><path d="M6 21h8"/></>} />,
  down:   <SvgIcon d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>} />,
  up:     <SvgIcon d={<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>} />,
  x:      <SvgIcon d={<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>} />,
};

/** Maps wine color string → CSS badge class suffix */
const colorBadgeClass = (color) => ({
  Red: "bg-r", White: "bg-w", "Rosé": "bg-rs",
  Sparkling: "bg-sp", Sweet: "bg-sw", Orange: "bg-o",
}[color] || "bg-w");


/* ════════════════════════════════════════════════════════════════════
   SECTION 8: BOTTLE FORM MODAL COMPONENT
   ────────────────────────────────────────────────────────────────────
   Reusable modal form for adding/editing bottles in both the cellar
   and consumed tabs. Props:
   
   - bottle:    Existing bottle data (null for new bottle)
   - onSave:    Callback with the form data when saved
   - onClose:   Callback to close the modal
   - showScore: If true, shows the Score (1-100) field (for consumed wines)
   - title:     Modal header text
   ════════════════════════════════════════════════════════════════════ */
function BottleFormModal({ bottle, onSave, onClose, showScore, title }) {
  const [form, setForm] = useState(bottle || emptyBottle());
  const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <div className="ov" onClick={onClose}>
      <div className="md" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 className="md-t">{title}</h2>
          <button className="ib" onClick={onClose}>{Icons.x}</button>
        </div>

        {/* Form Grid — 2 columns, full-width fields use className="ff" */}
        <div className="fg">
          {/* Wine Name — required, full width */}
          <div className="ff">
            <label className="lb">Wine Name *</label>
            <input className="ip" value={form.name}
              onChange={e => update("name", e.target.value)}
              placeholder="e.g. Château Margaux" />
          </div>

          {/* Region — free text input (supports any region worldwide) */}
          <div>
            <label className="lb">Region</label>
            <input className="ip" value={form.region}
              onChange={e => update("region", e.target.value)}
              placeholder="e.g. Bordeaux" />
          </div>

          {/* Country — free text input (supports any country) */}
          <div>
            <label className="lb">Country</label>
            <input className="ip" value={form.country}
              onChange={e => update("country", e.target.value)}
              placeholder="e.g. France" />
          </div>

          {/* Grape / Blend */}
          <div>
            <label className="lb">Grape / Blend</label>
            <input className="ip" value={form.grape}
              onChange={e => update("grape", e.target.value)}
              placeholder="e.g. Pinot Noir" />
          </div>

          {/* Color — dropdown with predefined options */}
          <div>
            <label className="lb">Color</label>
            <select className="sl" value={form.color}
              onChange={e => update("color", e.target.value)}>
              {COLOR_OPTIONS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {/* Vintage — text field to support "NV" (non-vintage) */}
          <div>
            <label className="lb">Vintage</label>
            <input className="ip" value={form.vintage}
              onChange={e => update("vintage", e.target.value)}
              placeholder="2020 or NV" />
          </div>

          {/* Amount — number of bottles */}
          <div>
            <label className="lb">Amount</label>
            <input className="ip" type="number" min="1" value={form.amount}
              onChange={e => update("amount", Math.max(1, parseInt(e.target.value) || 1))} />
          </div>

          {/* Drinking Window — start year */}
          <div>
            <label className="lb">Window — From</label>
            <input className="ip" value={form.windowStart}
              onChange={e => update("windowStart", e.target.value)}
              placeholder="2025" />
          </div>

          {/* Drinking Window — end year */}
          <div>
            <label className="lb">Window — To</label>
            <input className="ip" value={form.windowEnd}
              onChange={e => update("windowEnd", e.target.value)}
              placeholder="2030" />
          </div>

          {/* Price — free text to support different currencies */}
          <div>
            <label className="lb">Price</label>
            <input className="ip" value={form.price}
              onChange={e => update("price", e.target.value)}
              placeholder="₪" />
          </div>

          {/* Score — only shown for consumed wines (1-100 scale) */}
          {showScore && (
            <div>
              <label className="lb">Score (1–100)</label>
              <input className="ip" type="number" min="1" max="100"
                value={form.score || ""}
                onChange={e => update("score", Math.min(100, Math.max(0, parseInt(e.target.value) || "")))}
                placeholder="85" />
            </div>
          )}

          {/* Ready to Drink Status
              ─────────────────────
              If drinking window exists → shows auto-calculated status (read-only badge)
              If no window data → shows manual checkbox as fallback */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: 2, gap: 4 }}>
            {(form.windowStart || form.windowEnd) ? (
              <div style={{ fontSize: 12, color: "var(--t3)" }}>
                <span className={`bg ${isReady(form) ? "bg-y" : "bg-n"}`} style={{ fontSize: 11 }}>
                  {isReady(form) ? "Ready — in window" : "Not ready — outside window"}
                </span>
                <div style={{ marginTop: 4, fontSize: 11, color: "var(--t3)" }}>
                  Auto-calculated from window ({CURRENT_YEAR})
                </div>
              </div>
            ) : (
              <label className="ck">
                <input type="checkbox" checked={form.ready}
                  onChange={e => update("ready", e.target.checked)} />
                Ready to drink (manual)
              </label>
            )}
          </div>

          {/* Notes — full width textarea */}
          <div className="ff">
            <label className="lb">Notes</label>
            <textarea className="ta" value={form.notes}
              onChange={e => update("notes", e.target.value)}
              placeholder="Tasting notes, where purchased…" />
          </div>
        </div>

        {/* Form Actions */}
        <div className="fa">
          <button className="bt bt-p"
            onClick={() => { if (form.name.trim()) onSave(form); }}>
            Save
          </button>
          <button className="bt bt-g" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}


/* ════════════════════════════════════════════════════════════════════
   SECTION 9: SORTABLE TABLE HEADER COMPONENT
   ────────────────────────────────────────────────────────────────────
   A clickable <th> that shows sort direction indicators.
   Clicking toggles between ascending/descending sort on that field.
   ════════════════════════════════════════════════════════════════════ */
function SortableHeader({ label, field, currentSortField, currentSortDir, onSort }) {
  const isActive = currentSortField === field;
  return (
    <th onClick={() => onSort(field)}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
        {label}
        {isActive && (
          <span style={{ fontSize: 9, opacity: 0.7 }}>
            {currentSortDir === "asc" ? "▲" : "▼"}
          </span>
        )}
      </span>
    </th>
  );
}


/* ════════════════════════════════════════════════════════════════════
   SECTION 10: AI SOMMELIER COMPONENT
   ────────────────────────────────────────────────────────────────────
   Sends the complete cellar inventory to Claude (Sonnet) via the
   Anthropic API for a personalized collection analysis.
   
   The AI receives:
   - Aggregate stats (counts, distributions, percentages)
   - Full inventory line-by-line
   - Consumed wine scores (if any)
   
   And returns a structured analysis covering:
   - Collection profile & collecting style
   - Strengths of the collection
   - Gaps & buying recommendations
   - Wines to drink now (closing windows)
   - Categories to stop buying
   - 3 specific bottle recommendations
   ════════════════════════════════════════════════════════════════════ */
function AISommelier({ cellar, consumed }) {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Builds a detailed prompt summarizing the entire collection.
   * Includes both aggregate statistics and per-bottle inventory.
   */
  const buildPrompt = () => {
    const totalBottles = cellar.reduce((sum, b) => sum + (b.amount || 1), 0);

    // Aggregate by color
    const byColor = {};
    cellar.forEach(b => { byColor[b.color] = (byColor[b.color] || 0) + (b.amount || 1); });

    // Aggregate by country
    const byCountry = {};
    cellar.forEach(b => { if (b.country) byCountry[b.country] = (byCountry[b.country] || 0) + (b.amount || 1); });

    // Aggregate by region
    const byRegion = {};
    cellar.forEach(b => { if (b.region) byRegion[b.region] = (byRegion[b.region] || 0) + (b.amount || 1); });

    // Grape statistics
    const grapes = getGrapeStats(cellar);

    // Vintage statistics
    const vintages = cellar
      .filter(b => b.vintage && b.vintage !== "NV")
      .map(b => parseInt(b.vintage))
      .filter(Boolean);
    const avgVintage = vintages.length
      ? Math.round(vintages.reduce((a, b) => a + b, 0) / vintages.length)
      : "N/A";

    // Ready percentage
    const readyPct = totalBottles > 0
      ? Math.round(cellar.filter(b => isReady(b)).reduce((s, b) => s + (b.amount || 1), 0) / totalBottles * 100)
      : 0;

    // Price statistics
    const priced = cellar.filter(b => !isNaN(parsePrice(b.price)));
    const avgPrice = priced.length
      ? Math.round(priced.reduce((s, b) => s + parsePrice(b.price), 0) / priced.length)
      : "N/A";

    // Consumed wine scores
    const scored = consumed.filter(b => b.score);
    const avgScore = scored.length
      ? (scored.reduce((s, b) => s + Number(b.score), 0) / scored.length).toFixed(1)
      : "N/A";
    const topScored = scored
      .sort((a, b) => Number(b.score) - Number(a.score))
      .slice(0, 5)
      .map(b => `${b.name} (${b.score})`)
      .join(", ");

    // Full inventory for AI context
    const winesList = cellar.map(b =>
      `${b.amount}x ${b.name} | ${b.region}, ${b.country} | ${b.grape} | ${b.color} | ${b.vintage} | Window: ${b.windowStart || "?"}-${b.windowEnd || "?"} | ${isReady(b) ? "Ready" : "Not ready"}${b.price ? " | Price: " + b.price : ""}`
    ).join("\n");

    return `You are an expert sommelier and wine collection advisor. Analyze this wine cellar and provide insightful, personalized advice. Be specific — reference actual wines in the collection by name. Speak to the collector directly.

CELLAR OVERVIEW:
- Total bottles: ${totalBottles}
- Colors: ${Object.entries(byColor).map(([c, n]) => `${c}: ${n}`).join(", ")}
- Countries: ${Object.entries(byCountry).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c}: ${n}`).join(", ")}
- Top regions: ${Object.entries(byRegion).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([r, n]) => `${r}: ${n}`).join(", ")}
- Top grapes: ${grapes.slice(0, 10).map(([g, n]) => `${g}: ${n}`).join(", ")}
- Average vintage: ${avgVintage}
- Ready to drink: ${readyPct}%
- Average bottle price: ${avgPrice}
${scored.length > 0 ? `- Avg consumed score: ${avgScore}\n- Top scored wines: ${topScored}` : "- No consumed wines scored yet"}

FULL INVENTORY:
${winesList}

Please provide a thorough analysis with these sections (use markdown headers ##):

## Collection Profile
A brief characterization of this cellar's identity — what kind of collector is this? What's the style and philosophy?

## Strengths
What's impressive or well-curated about this collection. Be specific with wine names.

## Gaps & Opportunities
What regions, grapes, or styles are underrepresented? What would diversify and strengthen the collection? Give specific wine/producer recommendations.

## What to Drink Now
Wines whose drinking windows are closing soon (2025-2026) — prioritize these. Name them specifically.

## What NOT to Buy More Of
Any categories that are over-represented and don't need more additions right now.

## 3 Specific Bottle Recommendations
Three specific bottles to buy next, with reasoning based on what's missing.

Keep the tone knowledgeable but warm — like a trusted sommelier friend.`;
  };

  /** Sends the prompt to Claude and streams the response */
  const runAnalysis = async () => {
    setLoading(true);
    setError("");
    setAnalysis("");

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: buildPrompt() }],
        }),
      });

      const data = await response.json();
      const text = data.content?.map(c => c.text || "").join("\n") || "No response received.";
      setAnalysis(text);
    } catch (e) {
      setError("Failed to connect to AI. Please try again.");
      console.error("AI Sommelier error:", e);
    }

    setLoading(false);
  };

  /** Simple markdown-to-JSX renderer for the AI response */
  const renderMarkdown = (md) => {
    return md.split("\n").map((line, i) => {
      if (line.startsWith("## ")) {
        return <h3 key={i} style={{ fontFamily: "var(--sf)", fontSize: 20, fontWeight: 600, marginTop: 24, marginBottom: 8, color: "var(--t1)", letterSpacing: "-0.01em" }}>{line.slice(3)}</h3>;
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return <p key={i} style={{ fontWeight: 600, margin: "6px 0", fontSize: 14 }}>{line.slice(2, -2)}</p>;
      }
      if (line.startsWith("- ")) {
        return <div key={i} style={{ paddingLeft: 16, position: "relative", margin: "4px 0", fontSize: 14, lineHeight: 1.6, color: "var(--t2)" }}><span style={{ position: "absolute", left: 0 }}>·</span>{line.slice(2)}</div>;
      }
      if (line.trim() === "") return <div key={i} style={{ height: 8 }} />;
      return <p key={i} style={{ margin: "4px 0", fontSize: 14, lineHeight: 1.7, color: "var(--t2)" }}>{line}</p>;
    });
  };

  return (
    <div style={{ border: "1px solid var(--bdr)", borderRadius: 14, padding: 24, marginTop: 24 }}>
      {/* Header with title and action button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: "var(--sf)", fontSize: 20, fontWeight: 600 }}>AI Sommelier</div>
          <div style={{ fontSize: 12, color: "var(--t3)", marginTop: 2 }}>Powered by Claude — personalized analysis of your collection</div>
        </div>
        <button className="bt bt-p" onClick={runAnalysis} disabled={loading} style={{ opacity: loading ? 0.6 : 1 }}>
          {loading ? "Analyzing…" : analysis ? "Re-analyze" : "Analyze My Cellar"}
        </button>
      </div>

      {/* Error state */}
      {error && <div style={{ color: "var(--red)", fontSize: 13, marginBottom: 12 }}>{error}</div>}

      {/* Loading animation */}
      {loading && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--t3)" }}>
          <div className="ai-pulse" style={{ fontSize: 28, marginBottom: 10 }}>🍷</div>
          <div style={{ fontSize: 13 }}>Tasting through your collection…</div>
        </div>
      )}

      {/* Analysis results */}
      {analysis && !loading && (
        <div style={{ borderTop: "1px solid var(--bdr)", paddingTop: 16 }}>
          {renderMarkdown(analysis)}
        </div>
      )}
    </div>
  );
}


/* ════════════════════════════════════════════════════════════════════
   SECTION 11: STATISTICS DASHBOARD COMPONENT
   ────────────────────────────────────────────────────────────────────
   Displays:
   - Top-level KPI cards (total bottles, consumed, avg score, ready count,
     avg price, cellar value)
   - Three breakdown panels: By Color, By Country, Top Grapes
   - AI Sommelier panel
   
   Price statistics are calculated ONLY from bottles that have a valid
   price value — bottles without price are excluded from avg/total.
   ════════════════════════════════════════════════════════════════════ */
function StatsDashboard({ cellar, consumed }) {
  // ── KPI calculations ──
  const totalBottles = cellar.reduce((sum, b) => sum + (b.amount || 1), 0);
  const totalConsumed = consumed.length;

  // Average score — only from consumed wines that have been scored
  const scoredWines = consumed.filter(b => b.score);
  const avgScore = scoredWines.length
    ? (scoredWines.reduce((sum, b) => sum + Number(b.score), 0) / scoredWines.length).toFixed(1)
    : "—";

  // Ready to drink count — uses auto-calculated isReady()
  const readyCount = cellar.filter(b => isReady(b)).reduce((sum, b) => sum + (b.amount || 1), 0);

  // Price statistics — ONLY bottles with a valid numeric price
  // Cellar: average price per bottle in cellar
  const pricedCellar = cellar.filter(b => !isNaN(parsePrice(b.price)));
  const avgPriceCellar = pricedCellar.length
    ? Math.round(pricedCellar.reduce((sum, b) => sum + parsePrice(b.price), 0) / pricedCellar.length)
    : null;

  // Consumed: average price per consumed bottle
  const pricedConsumed = consumed.filter(b => !isNaN(parsePrice(b.price)));
  const avgPriceConsumed = pricedConsumed.length
    ? Math.round(pricedConsumed.reduce((sum, b) => sum + parsePrice(b.price), 0) / pricedConsumed.length)
    : null;

  // Total cellar value — sum of (price × amount) for all priced cellar bottles
  const cellarValue = pricedCellar.reduce((sum, b) => sum + parsePrice(b.price) * (b.amount || 1), 0);

  // ── Distribution breakdowns ──
  const byColor = {};
  cellar.forEach(b => { byColor[b.color] = (byColor[b.color] || 0) + (b.amount || 1); });
  const colorRanking = Object.entries(byColor).sort((a, b) => b[1] - a[1]);

  const byCountry = {};
  cellar.forEach(b => { if (b.country) byCountry[b.country] = (byCountry[b.country] || 0) + (b.amount || 1); });
  const countryRanking = Object.entries(byCountry).sort((a, b) => b[1] - a[1]);

  const grapeStats = getGrapeStats(cellar);

  return (
    <>
      {/* ── Top KPI Cards ── */}
      <div className="sg">
        <div className="st"><div className="sv">{totalBottles}</div><div className="sl2">Bottles in Cellar</div></div>
        <div className="st"><div className="sv">{totalConsumed}</div><div className="sl2">Consumed</div></div>
        <div className="st"><div className="sv">{avgScore}</div><div className="sl2">Avg. Score</div></div>
        <div className="st"><div className="sv">{readyCount}</div><div className="sl2">Ready to Drink</div></div>
        <div className="st">
          <div className="sv">{avgPriceCellar !== null ? `₪${avgPriceCellar}` : "—"}</div>
          <div className="sl2">Avg. Price — Cellar{pricedCellar.length > 0 ? ` (${pricedCellar.length})` : ""}</div>
        </div>
        <div className="st">
          <div className="sv">{avgPriceConsumed !== null ? `₪${avgPriceConsumed}` : "—"}</div>
          <div className="sl2">Avg. Price — Consumed{pricedConsumed.length > 0 ? ` (${pricedConsumed.length})` : ""}</div>
        </div>
        <div className="st">
          <div className="sv">{cellarValue > 0 ? `₪${Math.round(cellarValue).toLocaleString()}` : "—"}</div>
          <div className="sl2">Cellar Value</div>
        </div>
      </div>

      {/* ── Three-column breakdown: Color / Country / Grapes ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
        {/* By Color */}
        <div style={{ border: "1px solid var(--bdr)", borderRadius: 14, padding: 20 }}>
          <div style={{ fontFamily: "var(--sf)", fontSize: 18, fontWeight: 600, marginBottom: 14 }}>By Color</div>
          {colorRanking.map(([color, count]) => (
            <div key={color} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F2F0ED", fontSize: 13 }}>
              <span><span className={`bg ${colorBadgeClass(color)}`}>{color}</span></span>
              <span style={{ fontWeight: 500 }}>{count}</span>
            </div>
          ))}
        </div>

        {/* By Country */}
        <div style={{ border: "1px solid var(--bdr)", borderRadius: 14, padding: 20 }}>
          <div style={{ fontFamily: "var(--sf)", fontSize: 18, fontWeight: 600, marginBottom: 14 }}>By Country</div>
          {countryRanking.slice(0, 10).map(([country, count]) => (
            <div key={country} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F2F0ED", fontSize: 13 }}>
              <span>{country}</span>
              <span style={{ fontWeight: 500 }}>{count}</span>
            </div>
          ))}
        </div>

        {/* Top Grapes — with progress bars showing relative proportion */}
        <div style={{ border: "1px solid var(--bdr)", borderRadius: 14, padding: 20 }}>
          <div style={{ fontFamily: "var(--sf)", fontSize: 18, fontWeight: 600, marginBottom: 14 }}>Top Grapes</div>
          {grapeStats.slice(0, 12).map(([grape, count]) => {
            const percentage = Math.round(count / totalBottles * 100);
            return (
              <div key={grape} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                  <span>{grape}</span>
                  <span style={{ color: "var(--t3)", fontWeight: 500 }}>
                    {count} <span style={{ fontSize: 11 }}>({percentage}%)</span>
                  </span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: "var(--bg2)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${percentage}%`, background: "var(--t1)", borderRadius: 2, transition: "width 0.3s" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── AI Sommelier Panel ── */}
      <AISommelier cellar={cellar} consumed={consumed} />
    </>
  );
}


/* ════════════════════════════════════════════════════════════════════
   SECTION 12: MAIN APPLICATION COMPONENT
   ────────────────────────────────────────────────────────────────────
   The root component that manages:
   
   - State: cellar array, consumed array, active tab, modals, search/filter/sort
   - Data lifecycle: load from storage on mount, auto-save on every change
   - CRUD operations: add, edit, delete, consume (move from cellar → consumed)
   - CSV import/export
   - Delete confirmation modal (custom, since confirm() is blocked in artifacts)
   
   Tab structure:
   - "cellar"   → Active wine inventory table
   - "consumed" → Consumed wines with scores (no Window/Status columns)
   - "stats"    → Statistics dashboard + AI Sommelier
   ════════════════════════════════════════════════════════════════════ */
export default function App() {
  // ── Core data state ──
  const [cellar, setCellar] = useState([]);       // active cellar bottles
  const [consumed, setConsumed] = useState([]);    // consumed/drunk bottles
  const [loading, setLoading] = useState(true);    // initial data loading flag

  // ── UI state ──
  const [tab, setTab] = useState("cellar");        // active tab: "cellar" | "consumed" | "stats"
  const [modal, setModal] = useState(null);        // active modal: null | "add" | "edit" | "consume" | "addC" | "editC"
  const [editTarget, setEditTarget] = useState(null); // bottle being edited
  const [search, setSearch] = useState("");         // search query text
  const [filterColor, setFilterColor] = useState("");     // active color filter (empty = all)
  const [filterReady, setFilterReady] = useState("");     // "ready" | "not" | "" (empty = all)
  const [sortField, setSortField] = useState("name");     // which field to sort by
  const [sortDir, setSortDir] = useState("asc");          // "asc" | "desc"
  const [deleteConfirm, setDeleteConfirm] = useState(null); // {id, type, name} for delete confirmation

  const fileInputRef = useRef(null); // hidden file input for CSV import

  /* ── Load data from persistent storage on mount ── */
  useEffect(() => {
    (async () => {
      const [cellarData, consumedData, isInitialized] = await Promise.all([
        loadFromStorage(STORAGE_KEYS.cellar),
        loadFromStorage(STORAGE_KEYS.consumed),
        loadFromStorage(STORAGE_KEYS.init),
      ]);

      if (!isInitialized) {
        // First launch — seed with initial data from CSV
        setCellar(INITIAL_CELLAR);
        setConsumed([]);
        await saveToStorage(STORAGE_KEYS.cellar, INITIAL_CELLAR);
        await saveToStorage(STORAGE_KEYS.consumed, []);
        await saveToStorage(STORAGE_KEYS.init, true);
      } else {
        // Subsequent launches — load from storage
        setCellar(cellarData || []);
        setConsumed(consumedData || []);
      }

      setLoading(false);
    })();
  }, []);

  /* ── Auto-save to persistent storage whenever data changes ── */
  useEffect(() => { if (!loading) saveToStorage(STORAGE_KEYS.cellar, cellar); }, [cellar, loading]);
  useEffect(() => { if (!loading) saveToStorage(STORAGE_KEYS.consumed, consumed); }, [consumed, loading]);

  /* ── Sort handler — toggles direction if same field, else sets new field ── */
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  /* ── Sort comparator function ── */
  const sortComparator = useCallback((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    // Numeric fields use numeric comparison
    if (["vintage", "amount", "score"].includes(sortField)) {
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
    } else {
      valA = String(valA || "").toLowerCase();
      valB = String(valB || "").toLowerCase();
    }

    if (valA < valB) return sortDir === "asc" ? -1 : 1;
    if (valA > valB) return sortDir === "asc" ? 1 : -1;
    return 0;
  }, [sortField, sortDir]);

  /* ── Filter function — combines search, color filter, and ready filter ── */
  const filterPredicate = useCallback(bottle => {
    // Text search across name, region, country, grape, notes
    if (search) {
      const query = search.toLowerCase();
      const searchable = [bottle.name, bottle.region, bottle.country, bottle.grape, bottle.notes];
      if (!searchable.some(field => (field || "").toLowerCase().includes(query))) return false;
    }

    // Color filter
    if (filterColor && bottle.color !== filterColor) return false;

    // Ready status filter (uses auto-calculated isReady)
    if (filterReady === "ready" && !isReady(bottle)) return false;
    if (filterReady === "not" && isReady(bottle)) return false;

    return true;
  }, [search, filterColor, filterReady]);

  /* ── Derived filtered + sorted list for current tab ── */
  const displayList = useMemo(() => {
    const source = tab === "consumed" ? consumed : cellar;
    return source.filter(filterPredicate).sort(sortComparator);
  }, [tab, cellar, consumed, filterPredicate, sortComparator]);

  /* ════════════════════════════════════════
     CRUD OPERATIONS
     ════════════════════════════════════════ */

  /** Add a new bottle to the cellar */
  const addBottle = (bottle) => {
    setCellar(prev => [...prev, bottle]);
    setModal(null);
  };

  /** Update an existing cellar bottle */
  const updateBottle = (bottle) => {
    setCellar(prev => prev.map(b => b.id === bottle.id ? bottle : b));
    setModal(null);
  };

  /** Request deletion of a cellar bottle (shows confirmation modal) */
  const requestDeleteBottle = (id) => {
    const bottle = cellar.find(b => b.id === id);
    setDeleteConfirm({ id, type: "cellar", name: bottle?.name || "this bottle" });
  };

  /**
   * Move a bottle from cellar → consumed.
   * If amount > 1, decrements the cellar count by 1.
   * If amount = 1, removes from cellar entirely.
   * Opens a form to add score before confirming.
   */
  const initiateConsume = (bottle) => {
    setEditTarget({ ...bottle });
    setModal("consume");
  };

  /** Confirms the consume action — moves bottle to consumed list */
  const confirmConsume = (bottle) => {
    setCellar(prev => {
      const existing = prev.find(b => b.id === bottle.id);
      if (existing && existing.amount > 1) {
        return prev.map(b => b.id === bottle.id ? { ...b, amount: b.amount - 1 } : b);
      }
      return prev.filter(b => b.id !== bottle.id);
    });

    setConsumed(prev => [...prev, {
      ...bottle,
      id: uid(),        // new ID for the consumed entry
      amount: 1,        // always 1 bottle consumed at a time
      consumedDate: new Date().toISOString().slice(0, 10),
      source: "cellar", // track that this came from the cellar
    }]);

    setModal(null);
  };

  /** Add a consumed wine directly (not from cellar) */
  const addConsumedDirect = (bottle) => {
    setConsumed(prev => [...prev, {
      ...bottle,
      consumedDate: new Date().toISOString().slice(0, 10),
      source: "external", // track that this was consumed outside the cellar
    }]);
    setModal(null);
  };

  /** Update an existing consumed wine entry */
  const updateConsumed = (bottle) => {
    setConsumed(prev => prev.map(b => b.id === bottle.id ? bottle : b));
    setModal(null);
  };

  /** Request deletion of a consumed wine (shows confirmation modal) */
  const requestDeleteConsumed = (id) => {
    const bottle = consumed.find(b => b.id === id);
    setDeleteConfirm({ id, type: "consumed", name: bottle?.name || "this wine" });
  };

  /** Execute confirmed deletion */
  const executeDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "cellar") {
      setCellar(prev => prev.filter(b => b.id !== deleteConfirm.id));
    } else {
      setConsumed(prev => prev.filter(b => b.id !== deleteConfirm.id));
    }
    setDeleteConfirm(null);
  };

  /** Handle CSV file import — reads file and adds bottles to cellar */
  const handleCSVImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const bottles = csvToBottles(e.target.result);
      if (bottles.length) {
        setCellar(prev => [...prev, ...bottles]);
        alert(`Imported ${bottles.length} bottles`);
      }
    };
    reader.readAsText(file);
    event.target.value = ""; // reset input for re-importing
  };

  /* ── Loading screen ── */
  if (loading) {
    return (
      <div className="wa" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <style>{STYLESHEET}</style>
        <div style={{ textAlign: "center", color: "var(--t3)" }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🍷</div>
          <div>Loading cellar…</div>
        </div>
      </div>
    );
  }

  // Shorthand for checking if we're on the consumed tab
  const isConsumedTab = tab === "consumed";

  // Common props passed to every SortableHeader
  const sortProps = { currentSortField: sortField, currentSortDir: sortDir, onSort: handleSort };

  /* ════════════════════════════════════════
     RENDER
     ════════════════════════════════════════ */
  return (
    <div className="wa">
      <style>{STYLESHEET}</style>

      {/* ── Header ── */}
      <header className="hd">
        <div className="hd-in">
          <div className="logo"><span className="logo-d" />The Cellar</div>
          <nav className="nav">
            <b className={tab === "cellar" ? "on" : ""} onClick={() => setTab("cellar")}>Cellar</b>
            <b className={tab === "consumed" ? "on" : ""} onClick={() => setTab("consumed")}>Consumed</b>
            <b className={tab === "stats" ? "on" : ""} onClick={() => setTab("stats")}>Stats</b>
          </nav>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <div className="bd">

        {/* Stats Tab */}
        {tab === "stats" && <StatsDashboard cellar={cellar} consumed={consumed} />}

        {/* Cellar & Consumed Tabs */}
        {tab !== "stats" && (
          <>
            {/* ── Toolbar: Search + Filter Chips ── */}
            <div className="tb">
              <div className="sr">
                <span className="sr-i">{Icons.search}</span>
                <input
                  placeholder="Search by name, region, grape…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {/* Color filter chips */}
              {COLOR_OPTIONS.map(color => (
                <span key={color}
                  className={`ch ${filterColor === color ? "on" : ""}`}
                  onClick={() => setFilterColor(filterColor === color ? "" : color)}>
                  {color}
                </span>
              ))}

              {/* Ready/Not Ready filter chips (only visible in cellar tab) */}
              <span className={`ch ${filterReady === "ready" ? "on" : ""}`}
                onClick={() => setFilterReady(filterReady === "ready" ? "" : "ready")}>Ready</span>
              <span className={`ch ${filterReady === "not" ? "on" : ""}`}
                onClick={() => setFilterReady(filterReady === "not" ? "" : "not")}>Not Ready</span>
            </div>

            {/* ── Action Buttons ── */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
              {/* Add button — different label per tab */}
              {!isConsumedTab && (
                <button className="bt bt-p" onClick={() => { setEditTarget(null); setModal("add"); }}>
                  {Icons.plus} Add Bottle
                </button>
              )}
              {isConsumedTab && (
                <button className="bt bt-p" onClick={() => { setEditTarget(null); setModal("addC"); }}>
                  {Icons.plus} Add Consumed
                </button>
              )}

              {/* CSV Export */}
              <button className="bt bt-g"
                onClick={() => downloadCSV(
                  bottlesToCSV(isConsumedTab ? consumed : cellar, isConsumedTab),
                  isConsumedTab ? "consumed.csv" : "cellar.csv"
                )}>
                {Icons.down} Export CSV
              </button>

              {/* CSV Import — cellar only */}
              {!isConsumedTab && (
                <>
                  <button className="bt bt-g" onClick={() => fileInputRef.current?.click()}>
                    {Icons.up} Import CSV
                  </button>
                  <input ref={fileInputRef} type="file" accept=".csv"
                    style={{ display: "none" }} onChange={handleCSVImport} />
                </>
              )}
            </div>

            {/* ── Table or Empty State ── */}
            {displayList.length === 0 ? (
              <div className="em">
                <div className="em-i">🍾</div>
                <div className="em-t">
                  {search || filterColor || filterReady
                    ? "No results found"
                    : isConsumedTab ? "No consumed wines yet" : "Your cellar is empty"}
                </div>
                <div style={{ fontSize: 13 }}>
                  {!search && !filterColor && !filterReady && !isConsumedTab
                    ? 'Click "Add Bottle" to start'
                    : ""}
                </div>
              </div>
            ) : (
              <div className="tw">
                <table>
                  <thead>
                    <tr>
                      <SortableHeader label="QTY"     field="amount"  {...sortProps} />
                      <SortableHeader label="WINE"    field="name"    {...sortProps} />
                      <SortableHeader label="REGION"  field="region"  {...sortProps} />
                      <SortableHeader label="COUNTRY" field="country" {...sortProps} />
                      <SortableHeader label="GRAPE"   field="grape"   {...sortProps} />
                      <th>COLOR</th>
                      <SortableHeader label="VINTAGE" field="vintage" {...sortProps} />

                      {/* Window & Status columns — cellar only */}
                      {!isConsumedTab && <th>WINDOW</th>}
                      {!isConsumedTab && <th>STATUS</th>}

                      {/* Price column — visible in both tabs */}
                      <th>PRICE</th>

                      {/* Score — consumed only */}
                      {isConsumedTab && <SortableHeader label="SCORE" field="score" {...sortProps} />}

                      {/* Source — consumed only: where the bottle came from */}
                      {isConsumedTab && <th>SOURCE</th>}

                      <th>NOTES</th>
                      <th style={{ textAlign: "center" }}>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayList.map(bottle => (
                      <tr key={bottle.id}>
                        <td style={{ fontWeight: 600 }}>{bottle.amount || 1}</td>
                        <td><div className="wn">{bottle.name}</div></td>
                        <td>{bottle.region}</td>
                        <td>{bottle.country}</td>
                        <td style={{ fontSize: 12, color: "var(--t2)" }}>{bottle.grape}</td>
                        <td><span className={`bg ${colorBadgeClass(bottle.color)}`}>{bottle.color}</span></td>
                        <td>{bottle.vintage}</td>

                        {/* Window — cellar only */}
                        {!isConsumedTab && (
                          <td style={{ whiteSpace: "nowrap" }}>
                            {bottle.windowStart || bottle.windowEnd
                              ? `${bottle.windowStart || "?"} – ${bottle.windowEnd || "?"}`
                              : ""}
                          </td>
                        )}

                        {/* Status badge — cellar only, auto-calculated */}
                        {!isConsumedTab && (
                          <td>
                            <span className={`bg ${isReady(bottle) ? "bg-y" : "bg-n"}`}>
                              {isReady(bottle) ? "Ready" : "Not ready"}
                            </span>
                          </td>
                        )}

                        {/* Price — both tabs */}
                        <td>{bottle.price || "—"}</td>

                        {/* Score — consumed only */}
                        {isConsumedTab && (
                          <td><span className="sc">{bottle.score || "—"}</span></td>
                        )}

                        {/* Source — consumed only: "Cellar" or "External" */}
                        {isConsumedTab && (
                          <td>
                            <span className={`bg ${bottle.source === "cellar" ? "bg-sp" : "bg-o"}`}>
                              {bottle.source === "cellar" ? "Cellar" : "External"}
                            </span>
                          </td>
                        )}

                        {/* Notes — truncated with tooltip */}
                        <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          title={bottle.notes}>
                          {bottle.notes || ""}
                        </td>

                        {/* Action Buttons */}
                        <td>
                          <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>
                            {/* Cellar actions: Edit + Consume */}
                            {!isConsumedTab && (
                              <>
                                <button className="ib" title="Edit"
                                  onClick={() => { setEditTarget(bottle); setModal("edit"); }}>
                                  {Icons.edit}
                                </button>
                                <button className="ib" title="Mark as consumed"
                                  onClick={() => initiateConsume(bottle)}>
                                  {Icons.glass}
                                </button>
                              </>
                            )}

                            {/* Consumed actions: Edit */}
                            {isConsumedTab && (
                              <button className="ib" title="Edit"
                                onClick={() => { setEditTarget(bottle); setModal("editC"); }}>
                                {Icons.edit}
                              </button>
                            )}

                            {/* Delete — both tabs */}
                            <button className="ib dng" title="Delete"
                              onClick={() => isConsumedTab
                                ? requestDeleteConsumed(bottle.id)
                                : requestDeleteBottle(bottle.id)}>
                              {Icons.trash}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* ════════════════════════════════════════
         MODALS
         ════════════════════════════════════════ */}

      {/* Add new bottle to cellar */}
      {modal === "add" && (
        <BottleFormModal title="Add Bottle" onSave={addBottle} onClose={() => setModal(null)} />
      )}

      {/* Edit existing cellar bottle */}
      {modal === "edit" && (
        <BottleFormModal title="Edit Bottle" bottle={editTarget} onSave={updateBottle} onClose={() => setModal(null)} />
      )}

      {/* Move bottle from cellar to consumed (with score field) */}
      {modal === "consume" && (
        <BottleFormModal title="Mark as Consumed" bottle={editTarget} showScore onSave={confirmConsume} onClose={() => setModal(null)} />
      )}

      {/* Add consumed wine directly (not from cellar) */}
      {modal === "addC" && (
        <BottleFormModal title="Add Consumed Wine" showScore onSave={addConsumedDirect} onClose={() => setModal(null)} />
      )}

      {/* Edit existing consumed wine */}
      {modal === "editC" && (
        <BottleFormModal title="Edit Consumed Wine" bottle={editTarget} showScore onSave={updateConsumed} onClose={() => setModal(null)} />
      )}

      {/* ── Delete Confirmation Modal ──
          Custom implementation because confirm() is blocked in artifact sandboxes.
          Shows the wine name and requires explicit confirmation. */}
      {deleteConfirm && (
        <div className="ov" onClick={() => setDeleteConfirm(null)}>
          <div className="md" onClick={e => e.stopPropagation()}
            style={{ maxWidth: 400, textAlign: "center", padding: "36px 32px" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🗑</div>
            <div className="md-t" style={{ marginBottom: 8 }}>Delete Wine?</div>
            <div style={{ fontSize: 14, color: "var(--t2)", marginBottom: 24, lineHeight: 1.5 }}>
              Are you sure you want to delete<br />
              <strong style={{ color: "var(--t1)" }}>{deleteConfirm.name}</strong>?
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button className="bt" style={{ background: "var(--red)", color: "#fff" }} onClick={executeDelete}>
                Delete
              </button>
              <button className="bt bt-g" onClick={() => setDeleteConfirm(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
