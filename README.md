# appearance_anxiety

## Firebase Firestore

理想身材舊投票使用 Firestore collection：`body_shape_votes`。

體脂區間選擇統計使用 Firestore collection：`bodyChoiceStats`，document id 使用匿名 `bodyChoiceClientId`，同一台裝置更改選擇時會更新同一筆資料。

Firebase web config 請填在 `src/firebase.js` 的 `firebaseConfig`。不要把私人金鑰放進前端。

目前為專題展示用途，Firestore rules 需限制寫入格式，避免被濫用。

### Firebase 連線步驟

1. 到 Firebase Console 建立專案。
2. 在專案設定中新增 Web App，複製 Firebase web config。
3. 建立 Cloud Firestore database。
4. 將 web config 填入 `src/firebase.js` 的 `firebaseConfig`。
5. 到 Firestore 的 Rules 頁籤，貼上專案根目錄 `firestore.rules` 的內容並發布。
6. commit 並 push `src/firebase.js` 後，GitHub Pages 才會開始讀寫共用統計。

Firebase 尚未連線或共用樣本少於 5 筆時，頁面只顯示「資料不足」，不會將單一裝置的本機資料顯示為 100%。

## 理想身材圖片

圖片來源放在 `public/pic/B/`，目前也同步一份到 `pic/B/`，讓 GitHub Pages 專案頁能使用 `./pic/B/檔名` 顯示。

資料陣列在 `script.js` 的 `bodyFatImages`。

網頁引用圖片路徑使用 `./pic/B/檔名`，不要使用本機絕對路徑。
