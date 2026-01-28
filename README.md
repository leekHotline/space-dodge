

## How to init your project?
```
npx create-next-app@latest space-dodge --typescript --tailwind --app
cd space-dodge
npm install three @react-three/fiber @react-three/drei zustand
npm install @types/three --save-dev
```


### bugfix
```
gameStore.ts 中的状态字段与 Game.tsx 需要的不匹配
```