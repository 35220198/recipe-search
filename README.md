# Recipe Search

Search thousands of recipes by name or ingredient, filter by category, and open any dish for ingredients and step-by-step instructions. Save favourites, pick a random meal, and cook from any device. Works offline with built-in samples.

Built with plain HTML, CSS and JavaScript. No libraries and no API key.

## Features

- Search by **name** or by **ingredient**
- Category chips (Beef, Chicken, Dessert, Seafood and more)
- Recipe pages with photo, ingredient checklist, numbered steps, video and source links
- Save **favourites** with the heart button (kept in your browser)
- **Surprise me** button for a random recipe
- **Copy list** button to copy the ingredients for shopping
- Offline fallback: 8 built-in sample recipes
- Fits phones, tablets and desktops

## Where the recipes come from

Online, the page uses the free [TheMealDB](https://www.themealdb.com) API (test key `1`, no sign-up).
If you are offline or the service is down, a notice appears and the built-in sample recipes are shown instead.
TheMealDB's free key is meant for learning and testing. For a public site, get a supporter key from them.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page structure |
| `style.css` | Look and responsive layout |
| `script.js` | Search, favourites and recipe pages (sample recipes inside) |
| `README.md` | This guide |

Keep the three code files in the same folder with exactly these names.

## Run it (PowerShell)

```powershell
cd "C:\Users\-admin\Desktop\recipe-search"
python -m http.server 8000
```

Then open <http://localhost:8000>. You can also double-click `index.html`.
Press `Ctrl + C` in PowerShell to stop the server.
If `python` is not recognised, try `py -m http.server 8000`, or `npx serve .`

## How to use

1. Type a dish or ingredient and press **Search**, or tap a category.
2. Click a card to open the full recipe.
3. Tick ingredients as you gather them.
4. Tap the heart to save it, then open **Favourites** any time.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Can't reach the recipe service" | Check your internet connection. Sample recipes still work. |
| No photos | Photos load from the internet. Offline recipes use emoji instead. |
| Few results for an ingredient | Use the English singular name, e.g. `chicken breast` or `tomato`. |
| Page has no styling | Check `style.css` is in the same folder and not saved as `style.css.txt`. |
| Old version showing | Hard refresh with `Ctrl + F5`. |
| Favourites vanished | They are saved per browser. Clearing site data or private mode removes them. |

## Adding your own recipes

Add an entry to the `SAMPLE` list at the top of `script.js` (name, category, area, icon, ingredients and steps).
