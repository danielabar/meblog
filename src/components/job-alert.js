import React from "react"
import * as styles from "./job-alert.module.css"

const JobAlert = () => {
  return (
    <div className={styles.jobAlert}>
      <p>
        <strong className={styles.strongText}>
          Looking for a Rails Developer?
        </strong>{" "}
        I am currently open to new opportunities, including contract roles. If
        your team needs a skilled Rails developer, please feel free to{" "}
        <a href="https://www.linkedin.com/in/danielabaron/">
          connect with me on LinkedIn
        </a>
        .
      </p>
    </div>
  )
}

export default JobAlert
