# Volume Controller

音量を調節するための Chrome 拡張機能

## 使い方

### ポップアップ

| ショートカット | 説明 |
| - | - |
| → | 音量を 10% 上げる |
| ← | 音量を 10% 下げる |
| Shift + → | 音量を 1% 上げる |
| Shift + ← | 音量を 1% 下げる |
| M | ミュート / ミュート解除 |

## 開発方法

### 環境構築

#### 1. nvm のインストール

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
```

参考：https://github.com/nvm-sh/nvm

#### 2. Node.js のインストール

```sh
nvm install 24
```

#### 3. 依存関係のインストール

```sh
npm install
```

### ビルド

```sh
npm run build
```
