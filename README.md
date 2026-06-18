# おとあそび

GitHub Pages で公開するスマホ向けの静的 Web アプリです。

音で遊ぶ小さなアプリを一覧から選べる形にしています。現在は、角丸タイルをタッチまたはドラッグすると短い音が鳴る `コロコロ`、波紋で遊ぶ `なみ`、泡を弾く `ぽこぽこ`、星形の音を鳴らす `きらきら`、やわらかいゼリーを押して遊ぶ `ぷにぷに` を実装しています。

今後は、流れる音の `さらさら`、舞う感覚の `ひらひら` も追加予定です。

トップページは一覧表示だけを担当し、各体験ページは `apps/` 配下に分けています。

```text
/
  index.html
  styles.css
apps/
  korokoro/
    index.html
    korokoro.css
    korokoro.js
  nami/
    index.html
    nami.css
    nami.js
  pokopoko/
    index.html
    pokopoko.css
    pokopoko.js
  kirakira/
    index.html
    kirakira.css
    kirakira.js
  punipuni/
    index.html
    punipuni.css
    punipuni.js
```

振動はブラウザと端末が Vibration API に対応している場合に動作します。iPhone の Safari / Chrome では Web からの振動がサポートされていないため、音と画面の反応のみ動作します。

## GitHub Pages

通常の公開 URL は次の形式です。

```text
https://gladiiiii.github.io/korokoro/
https://gladiiiii.github.io/korokoro/apps/korokoro/
https://gladiiiii.github.io/korokoro/apps/nami/
https://gladiiiii.github.io/korokoro/apps/pokopoko/
https://gladiiiii.github.io/korokoro/apps/kirakira/
https://gladiiiii.github.io/korokoro/apps/punipuni/
```

GitHub の `Settings > Pages` で Source を `Deploy from a branch`、Branch を `master` / `/root` に設定してください。
