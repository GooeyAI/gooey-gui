# Gooey-GUI Quickstart

1. Install Node LTS version (v18) using [nvm](https://github.com/nvm-sh/nvm)
```bash
nvm install 18.12.0
```
2. Install & start redis - https://redis.io/docs/getting-started/installation/install-redis-on-mac-os/
```bash
brew install redis
brew services start redis
```
4. Clone this repo
4. cd into your cloned directory & install dependencies
```bash
npm install
```
5. Copy .env file
```bash
cp .env.example .env
```
6. Either start the [python server](https://github.com/dara-network/ddgai/) on `localhost:8080`, or if you're lazy, use the test server in `.env` -
```bash
SERVER_HOST=http://gooey-api-test.us-1.gooey.ai
```
7. Start remix server
```bash
npm run dev
```
8. Open [localhost:3000](http://localhost:3000) in your browser

## Notes

- `base.tsx` -> List of React components

- `custom.css` -> Designer's css styles

- `app.css` -> Our css styles

- `app.tsx` -> Business logic for calling python APIs, and rendering components

## Remix Routing

<img width="890" alt="image" src="https://github.com/user-attachments/assets/6dc96840-3845-4180-9f09-0aaff3e0b05d">

