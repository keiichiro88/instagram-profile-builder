# 2026-10-23 セキュリティ対策

## 実施
- 実際の本番・mainの119dd0dから分離worktreeを作成。
- Next.js/eslint-config-nextを16.4.2、sharpを0.35.5へ更新。互換範囲の推移依存も更新。アプリ機能・APIキー・設定は変更なし。

## 決定
- 強制メジャー更新を行わず、既存のNode.js 24指定を維持。
- APIの実費を伴う生成は行わず、不正入力の早期拒否と独立モック検証を使う。

## 検証
- インストール・本番ビルド・型検査成功。
- 独立レビューにてAPIの400/413/429/200分岐を実依存とGeminiモックで確認。具体的な差分由来の退行なし。

## 未確認
- npm auditは28件（critical 2を含む）から9件highへ減少。残りはbracesを経由するビルド/CLI側依存。修正版なし。
- 全体lintは既存アプリソースのReact refs/effect規則4件エラー・6件警告。ソース変更は行っていない。全体lint成功とは扱わない。
- 実際のGemini生成とブラウザでの音声入力・保存の全操作は未実施。
- Vercel管理Node.jsの細かな修正版反映は未確定。

## 本番反映結果
- 修正コミット fb25da5。GitHub mainと専用修正ブランチへ保存。
- dpl_7SK8HQRLPdtx66ggvYN8GeZo4hvn をinstagram-profile-builder.vercel.appへ昇格。
- 本番トップ200、昇格前の本番設定ビルドで入力不足の棚卸し/画像APIは400。Gemini生成は呼び出していない。
- 復旧先 dpl_3CQbTqgEUGcvmbhuoi7gYejZkfGC を保持。

## 次
- Vercel管理Node.js反映完了と、実ユーザーの生成・保存操作を確認する。
