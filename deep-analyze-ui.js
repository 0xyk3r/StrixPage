import { chromium } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const BASE_URL = 'http://localhost:13232'
const SCREENSHOT_DIR = './screenshots'

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

async function deepAnalyzePage(browser, pageName, url) {
  const page = await browser.newPage()

  try {
    console.log(`\n📄 Analyzing: ${pageName}`)
    console.log(`   URL: ${url}`)

    // Navigate with longer timeout
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })

    // Wait for any loading animations to finish
    await page.waitForTimeout(2000)

    // Try to wait for the main content
    try {
      await page.waitForSelector('main, [role="main"], .content, [class*="container"]', { timeout: 5000 })
    } catch (e) {
      console.log(`   No main content selector found`)
    }

    // Take detailed screenshot
    const screenshotPath = path.join(SCREENSHOT_DIR, `${pageName}-detailed.png`)
    await page.screenshot({ path: screenshotPath, fullPage: true })
    console.log(`   ✓ Screenshot: ${screenshotPath}`)

    // Detailed DOM analysis
    const pageAnalysis = await page.evaluate(() => {
      const data = {
        title: document.title,
        url: window.location.href,
        html: {
          hasHeading: !!document.querySelector('h1, h2, h3'),
          mainElements: [],
          formElements: [],
          buttons: [],
          tables: [],
          modals: [],
          breadcrumbs: [],
          navigation: [],
          inputs: [],
          sections: []
        },
        structure: {
          mainSelector: null,
          sidebarSelector: null,
          headerSelector: null,
          footerSelector: null
        },
        accessibility: {
          hasAriaLabels: 0,
          hasAriaDescribedBy: 0,
          hasRole: 0
        },
        theme: {
          isDarkMode: document.documentElement.classList.contains('dark'),
          hasThemeToggle: false,
          htmlClasses: document.documentElement.className
        }
      }

      // Check structure
      if (document.querySelector('header, [role="banner"]')) data.structure.headerSelector = 'header or [role="banner"]'
      if (document.querySelector('nav, [role="navigation"]')) data.structure.sidebarSelector = 'nav or [role="navigation"]'
      if (document.querySelector('main, [role="main"]')) data.structure.mainSelector = 'main or [role="main"]'
      if (document.querySelector('footer, [role="contentinfo"]')) data.structure.footerSelector = 'footer or [role="contentinfo"]'

      // Collect headings
      document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h, i) => {
        if (i < 10) data.html.mainElements.push({
          tag: h.tagName,
          text: h.textContent?.substring(0, 100),
          class: h.className
        })
      })

      // Collect forms
      document.querySelectorAll('form').forEach((f, i) => {
        if (i < 5) {
          const inputs = f.querySelectorAll('input, textarea, select')
          data.html.formElements.push({
            id: f.id,
            class: f.className,
            inputCount: inputs.length
          })
        }
      })

      // Collect buttons
      document.querySelectorAll('button, [role="button"], a[class*="btn"]').forEach((b, i) => {
        if (i < 15) data.html.buttons.push({
          text: b.textContent?.substring(0, 50),
          class: b.className,
          title: b.title || b.getAttribute('aria-label')
        })
      })

      // Check for tables
      document.querySelectorAll('table, [role="grid"], [class*="table"]').forEach((t, i) => {
        if (i < 5) {
          const rows = t.querySelectorAll('tr, [role="row"]')
          const cols = t.querySelectorAll('th, td, [role="columnheader"], [role="gridcell"]')
          data.html.tables.push({
            type: t.tagName || 'custom',
            class: t.className,
            rowCount: rows.length,
            colCount: cols.length
          })
        }
      })

      // Check for modals/drawers
      document.querySelectorAll('[role="dialog"], .modal, [class*="modal"], [class*="drawer"]').forEach((m, i) => {
        if (i < 5) data.html.modals.push({
          class: m.className,
          role: m.getAttribute('role'),
          visible: m.offsetParent !== null
        })
      })

      // Check breadcrumbs
      document.querySelectorAll('[class*="breadcrumb"], [aria-label*="breadcrumb"]').forEach((b, i) => {
        if (i < 3) data.html.breadcrumbs.push({
          text: b.textContent?.substring(0, 100),
          class: b.className
        })
      })

      // Check navigation items
      document.querySelectorAll('nav a, [role="menuitem"], [role="navigation"] a, .sidebar a').forEach((n, i) => {
        if (i < 20) data.html.navigation.push({
          text: n.textContent?.substring(0, 50),
          href: n.getAttribute('href'),
          class: n.className
        })
      })

      // Check inputs
      document.querySelectorAll('input, textarea, select').forEach((inp, i) => {
        if (i < 15) data.html.inputs.push({
          type: inp.type || inp.tagName,
          placeholder: inp.placeholder,
          class: inp.className,
          name: inp.name
        })
      })

      // Accessibility check
      document.querySelectorAll('[aria-label]').forEach(() => data.accessibility.hasAriaLabels++)
      document.querySelectorAll('[aria-describedby]').forEach(() => data.accessibility.hasAriaDescribedBy++)
      document.querySelectorAll('[role]').forEach(() => data.accessibility.hasRole++)

      // Check for theme toggle
      document.querySelectorAll('button, a').forEach((el) => {
        const text = el.textContent?.toLowerCase() || ''
        const title = el.getAttribute('title')?.toLowerCase() || ''
        if (text.includes('dark') || text.includes('light') || text.includes('theme') ||
          title.includes('dark') || title.includes('light') || title.includes('theme')) {
          data.theme.hasThemeToggle = true
        }
      })

      // Get main visible sections
      document.querySelectorAll('section, [class*="section"], div[role="region"]').forEach((s, i) => {
        if (i < 10) data.html.sections.push({
          class: s.className,
          text: s.textContent?.substring(0, 50)
        })
      })

      return data
    })

    console.log(`   Title: ${pageAnalysis.title}`)
    console.log(`   Dark Mode: ${pageAnalysis.theme.isDarkMode}`)
    console.log(`   Theme Toggle: ${pageAnalysis.theme.hasThemeToggle}`)
    console.log(`   Structure:`, pageAnalysis.structure)
    console.log(`   Headings: ${pageAnalysis.html.mainElements.length}`)
    console.log(`   Forms: ${pageAnalysis.html.formElements.length}`)
    console.log(`   Buttons: ${pageAnalysis.html.buttons.length}`)
    console.log(`   Tables: ${pageAnalysis.html.tables.length}`)
    console.log(`   Navigation Items: ${pageAnalysis.html.navigation.length}`)
    console.log(`   Accessibility (aria labels): ${pageAnalysis.accessibility.hasAriaLabels}`)

    return pageAnalysis

  } catch (error) {
    console.error(`   ✗ Error: ${error.message}`)
    return null
  } finally {
    await page.close()
  }
}

async function main() {
  console.log('🚀 Starting Deep UI/UX Analysis for Strix Dashboard')
  console.log('='.repeat(80))

  const browser = await chromium.launch({ headless: true })

  try {
    const pagesToAnalyze = [
      ['Home', `${BASE_URL}/`],
      ['UserManagement', `${BASE_URL}/system/user`],
      ['RoleManagement', `${BASE_URL}/system/role`],
      ['MenuManagement', `${BASE_URL}/system/menu`],
      ['DictionaryManagement', `${BASE_URL}/system/dict`],
      ['MonitorServer', `${BASE_URL}/system/monitor/server`],
      ['SystemTools', `${BASE_URL}/system/tool`]
    ]

    const results = {}

    for (const [name, url] of pagesToAnalyze) {
      const analysis = await deepAnalyzePage(browser, name, url)
      if (analysis) results[name] = analysis
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('\n' + '='.repeat(80))
    console.log('📊 DETAILED ANALYSIS RESULTS')
    console.log('='.repeat(80))

    // Save to file for review
    const outputPath = path.join(SCREENSHOT_DIR, 'analysis-results.json')
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
    console.log(`✓ Results saved to: ${outputPath}`)

    // Print summary
    Object.entries(results).forEach(([pageName, data]) => {
      console.log(`\n📄 ${pageName}:`)
      console.log(`   URL: ${data.url}`)
      console.log(`   Headings: ${data.html.mainElements.length}`)
      console.log(`   Buttons: ${data.html.buttons.length}`)
      console.log(`   Tables: ${data.html.tables.length}`)
      console.log(`   Navigation Items: ${data.html.navigation.length}`)
      console.log(`   Accessibility Score: ${data.accessibility.hasAriaLabels + data.accessibility.hasAriaDescribedBy}`)
    })

  } finally {
    await browser.close()
  }
}

main().catch(console.error)
