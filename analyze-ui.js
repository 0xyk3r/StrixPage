import { chromium } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const BASE_URL = 'http://localhost:13232'
const SCREENSHOT_DIR = './screenshots'

// Create screenshots directory
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

const analysis = {
  pages: {},
  summary: {
    darkModeSupport: false,
    responsiveDesign: false,
    navigationStructure: '',
    commonIssues: [],
    suggestions: []
  }
}

async function analyzePage(browser, pageName, url) {
  const page = await browser.newPage()

  try {
    console.log(`\n📄 Analyzing: ${pageName} (${url})`)
    await page.goto(url, { waitUntil: 'networkidle' })

    // Take screenshot
    const screenshotPath = path.join(SCREENSHOT_DIR, `${pageName}.png`)
    await page.screenshot({ path: screenshotPath, fullPage: true })
    console.log(`✓ Screenshot saved: ${screenshotPath}`)

    // Get page title
    const title = await page.title()

    // Get viewport size
    const size = page.viewportSize()

    // Check for theme toggle
    const hasThemeToggle = await page.evaluate(() => {
      const themeElements = document.querySelectorAll(
        '[class*="dark"], [class*="theme"], [class*="mode"], button[title*="dark"], button[title*="theme"]'
      )
      return themeElements.length > 0
    })

    // Check for breadcrumbs
    const hasBreadcrumbs = await page.evaluate(() => {
      return !!document.querySelector('[class*="breadcrumb"], nav[aria-label="breadcrumb"]')
    })

    // Get navigation menu items
    const navItems = await page.evaluate(() => {
      const items = []
      const navElements = document.querySelectorAll('a[href], [role="menuitem"]')
      navElements.forEach((el) => {
        const text = el.textContent?.trim()
        const href = el.getAttribute('href')
        if (text && text.length < 50) {
          items.push({ text, href })
        }
      })
      return items.slice(0, 20)
    })

    // Check for search functionality
    const hasSearch = await page.evaluate(() => {
      return !!document.querySelector('input[placeholder*="search"], input[placeholder*="查"], [class*="search"]')
    })

    // Check for table/data grid
    const hasTable = await page.evaluate(() => {
      return !!document.querySelector('table, [role="grid"], [class*="table"], [class*="datagrid"]')
    })

    // Check for dark mode by detecting dark class
    const htmlClasses = await page.evaluate(() => {
      return document.documentElement.className
    })

    const isDarkMode = htmlClasses.includes('dark')

    // Check for modals/dialogs
    const hasModals = await page.evaluate(() => {
      return !!document.querySelector('[role="dialog"], .modal, [class*="modal"], [class*="drawer"]')
    })

    // Check for form elements
    const formElements = await page.evaluate(() => {
      const forms = document.querySelectorAll('form, [class*="form"]')
      return forms.length > 0
    })

    analysis.pages[pageName] = {
      url,
      title,
      viewport: size,
      isDarkMode,
      hasThemeToggle,
      hasBreadcrumbs,
      hasSearch,
      hasTable,
      hasModals,
      formElements,
      navigationItems: navItems.length,
      screenshotPath
    }

    console.log(`  Title: ${title}`)
    console.log(`  Dark Mode: ${isDarkMode}`)
    console.log(`  Theme Toggle: ${hasThemeToggle}`)
    console.log(`  Breadcrumbs: ${hasBreadcrumbs}`)
    console.log(`  Search: ${hasSearch}`)
    console.log(`  Has Tables: ${hasTable}`)

  } catch (error) {
    console.error(`✗ Error analyzing ${pageName}:`, error.message)
  } finally {
    await page.close()
  }
}

async function main() {
  const browser = await chromium.launch({ headless: false })

  try {
    // Check if localhost is accessible
    const testPage = await browser.newPage()
    try {
      await testPage.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 5000 })
      await testPage.close()
    } catch (error) {
      console.error('❌ Cannot connect to http://localhost:13232')
      console.error('Make sure the Strix application is running!')
      process.exit(1)
    }

    // Analyze pages
    const pagesToAnalyze = [
      ['Home', `${BASE_URL}/`],
      ['UserManagement', `${BASE_URL}/system/user`],
      ['RoleManagement', `${BASE_URL}/system/role`],
      ['MenuManagement', `${BASE_URL}/system/menu`],
      ['DictionaryManagement', `${BASE_URL}/system/dict`],
      ['MonitorServer', `${BASE_URL}/system/monitor/server`],
      ['MonitorCache', `${BASE_URL}/system/monitor/cache`],
      ['MonitorLog', `${BASE_URL}/system/monitor/log`],
      ['SystemTools', `${BASE_URL}/system/tool`]
    ]

    for (const [name, url] of pagesToAnalyze) {
      await analyzePage(browser, name, url)
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Output analysis
    console.log('\n' + '='.repeat(80))
    console.log('📊 ANALYSIS RESULTS')
    console.log('='.repeat(80))
    console.log(JSON.stringify(analysis, null, 2))

  } finally {
    await browser.close()
  }
}

main().catch(console.error)
