import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/studio',timeout:60000,workers:1,use:{headless:true,viewport:{width:1440,height:1000},launchOptions:{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}},reporter:'list'});
