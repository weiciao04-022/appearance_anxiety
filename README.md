# appearance_anxiety

## Firebase Firestore

理想身材舊投票使用 Firestore collection：`body_shape_votes`。

體脂區間選擇統計使用 Firestore collection：`bodyChoiceStats`，document id 使用匿名 `bodyChoiceClientId`，同一台裝置更改選擇時會更新同一筆資料。

Firebase web config 請填在 `src/firebase.js` 的 `firebaseConfig`。不要把私人金鑰放進前端。

目前為專題展示用途，Firestore rules 需限制寫入格式，避免被濫用。

## 理想身材圖片

圖片來源放在 `public/pic/B/`，目前也同步一份到 `pic/B/`，讓 GitHub Pages 直接服務 repository root 時能使用 `/pic/B/檔名` 顯示。

資料陣列在 `script.js` 的 `bodyFatImages`。

網頁引用圖片路徑使用 `/pic/B/檔名`，不要使用本機絕對路徑。
