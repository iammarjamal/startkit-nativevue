# NativeScript Vue with Vite Demo

Play around with NativeScript Vue and Vite.

https://github.com/user-attachments/assets/5fd4f6d6-d849-42b5-9437-a4c41ed9a4d5

Install latest cli (v9+): `npm install -g nativescript@latest`

Then setup the repo:
```
npm install
```

## Develop with HMR

This will start Vite dev server and open a socket to the NativeScript app to develop with HMR for quick edits.

```
npm run dev:ios

// Or...

npm run dev:android
```

## Develop with Live Reload

```
ns debug ios --no-hmr

// Or...

ns debug android --no-hmr
```

### Notes

This project is configured via [nativescript.config.ts](nativescript.config.ts) to use Vite.

Explore the [vite.config.ts](vite.config.ts) where you can customize per your own needs.
