import { resolve } from 'path'
import { defineConfig } from 'vite'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/main.ts'),
            name: 'tlmviewer',
            fileName: 'tlmviewer',
            formats: ['es'],
        },
    },
    plugins: [
        cssInjectedByJsPlugin(),
    ]
})
