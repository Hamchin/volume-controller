# Volume Controller

## ショートカット

| ショートカット | 説明 |
| - | - |
| 右矢印 | 音量を 10% 上げる |
| 左矢印 | 音量を 10% 下げる |
| Shift + 右矢印 | 音量を 1% 上げる |
| Shift + 左矢印 | 音量を 1% 下げる |
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
