import {defineConfig} from 'vite';
// host:true exposes the dev server on your Wi-Fi so a phone can open it.
export default defineConfig({base:'/flamingo-app/', server:{host:true,port:5173}});
