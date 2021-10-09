import React from "react"
import * as styles from "./layout.module.css"
import Header from "./header.js"
import Footer from "./footer.js"

const Layout = ({ children }) => (
  <div className={styles.container}>
    <Header />
    <div>{children}</div>
    <Footer />
  </div>
)

export default Layout