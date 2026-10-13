import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
 testDir:'./e2e',
 timeout:20000,
 retries:process.env.CI?1:0,
 use:{baseURL:'http://127.0.0.1:8765',trace:'retain-on-failure'},
 projects:[{name:'chromium-desktop',use:{...devices['Desktop Chrome']}},{name:'chromium-mobile',use:{...devices['Pixel 7']}}],
 webServer:{command:'python3 -m http.server 8765 --bind 127.0.0.1',port:8765,reuseExistingServer:!process.env.CI,timeout:15000}
});
