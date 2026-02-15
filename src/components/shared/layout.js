/**
 * Modern Layout Component
 *
 * Part of 2026 homepage redesign. Wraps pages with modern Header and Footer.
 * Includes grid background pattern for visual texture.
 *
 * Currently used only on homepage. May be adopted site-wide in future
 * redesigns to replace legacy src/components/layout.js.
 */
import React from "react"
import Header from "./header"
import Footer from "./footer"
import * as styles from "./layout.module.css"

const Layout = ({ children }) => (
  <div className={styles.container}>
    <Header />
    <main className={styles.main}>{children}</main>
    <Footer />
  </div>
)

export default Layout
