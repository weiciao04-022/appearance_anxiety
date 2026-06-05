# appearance_anxiety

## Firebase Firestore

理想身材投票使用 Firestore collection：`body_shape_votes`。

Firebase web config 請填在 `src/firebase.js` 的 `firebaseConfig`。不要把私人金鑰放進前端。

目前為專題展示用途，Firestore rules 需限制寫入格式，避免被濫用。

## 理想身材圖片

圖片放在 `public/pic/B/`，資料陣列在 `script.js` 的 `bodyOptions`。

目前專案是直接以 GitHub Pages 服務 repository root，因此圖片路徑使用 `public/pic/B/檔名`。若之後改成會把 `public` 當網站根目錄的 build 流程，可將 `script.js` 的 `bodyImageBasePath` 改成 `/pic/B/`。
