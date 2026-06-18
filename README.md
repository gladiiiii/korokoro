# おとあそび

GitHub Pages で公開するスマホ向けの静的 Web アプリです。

音で遊ぶ小さなアプリを一覧から選べる形にしています。現在は、角丸タイルをタッチまたはドラッグすると短い音が鳴る `コロコロ` を実装しています。

振動はブラウザと端末が Vibration API に対応している場合に動作します。iPhone の Safari / Chrome では Web からの振動がサポートされていないため、音と画面の反応のみ動作します。

## GitHub Pages

通常の公開 URL は次の形式です。

```text
https://gladiiiii.github.io/korokoro/
```

GitHub の `Settings > Pages` で Source を `Deploy from a branch`、Branch を `master` / `/root` に設定してください。
