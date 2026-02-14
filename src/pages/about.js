/* eslint-disable react/jsx-pascal-case */
import React from "react"
import SEO from "../components/SEO"
import Layout from "../components/layout"
import * as styles from "./about.module.css"
import AllLink from "../components/all-link"

const About = () => (
  <Layout>
    <SEO title="About" pathname="/about" />
    <div className={styles.container}>
      <h1 className={styles.header}>About</h1>

      <p className={styles.para}>
        Welcome! I'm a software engineer who's been building web applications
        for over 15 years. My journey has taken me through startups, product
        companies, and SaaS platforms across financial services, health tech,
        data infrastructure, and more. Through it all, I've maintained one clear
        focus: delivering working software that makes a difference.
      </p>

      <h2 className={styles.subheader}>What Drives Me</h2>

      <p className={styles.para}>
        I'm drawn to the kind of work that makes teams stronger and systems more
        resilient. That means tackling the foundational improvements others
        avoid, such as replacing inefficient search implementations with proper
        full-text indexing, platform and legacy upgrades, hardening security
        gaps, or transforming a codebase's architectural patterns so new
        developers can contribute confidently.
      </p>

      <p className={styles.para}>
        I believe software engineering is about solving real problems for real
        people, not demonstrating technical cleverness. My job is to understand
        what needs to happen, communicate the approach clearly, and deliver it
        in a way that others can maintain and build upon. Readable code beats
        clever code. Tests that tell a story beat tests that check
        implementation. Working solutions beat perfect architecture. Documented
        decisions beat institutional knowledge that lives in peoples heads.
      </p>

      <h2 className={styles.subheader}>How I Work</h2>

      <p className={styles.para}>
        I'm proactive about identifying problems before they become critical.
        When I see a revenue gap, a performance bottleneck, or a documentation
        void, I investigate, propose a solution, and execute it. I don't wait
        for perfect specifications, instead, I ask clarifying questions, build
        iteratively, and course-correct based on feedback.
      </p>

      <p className={styles.para}>
        I value transparency and knowledge-sharing. Whether it's through
        detailed PR reviews, comprehensive documentation, or writing blog posts
        that demystify complex topics, I invest in making knowledge accessible.
        Strong teams aren't built on hero developers; they're built on shared
        understanding and collective capability.
      </p>

      <h2 className={styles.subheader}>My Technical Philosophy</h2>

      <p className={styles.para}>
        I'm a full-stack generalist with deep expertise in Rails and PostgreSQL.
        I understand the entire system, from database design and query optimization to
        service layer to front-end interactivity to CI/CD pipeline
        configuration. I can navigate architectural decisions with a
        pragmatic eye toward trade-offs and long-term maintainability.
      </p>

      <p className={styles.para}>
        I embrace modern development practices: comprehensive testing, automated
        linting, observability with proper monitoring, incremental migrations
        that avoid big-bang rewrites, and feature flags for safe roll-outs. I
        also embrace AI-assisted development — not as autopilot, but as a force
        multiplier that lets me move faster while maintaining engineering rigor.
      </p>

      <h2 className={styles.subheader}>Beyond the Code</h2>

      <p className={styles.para}>
        I contribute to the broader engineering community through writing and
        open source work. My technical blog draws thousands of monthly readers
        and has been featured in Ruby Weekly, Short Ruby Newsletter, and Women
        on Rails. I write about practical problem-solving, architectural
        decisions, debugging strategies, and career development. I'm also active
        on{" "}
        <a href="https://linkedin.com/in/danielabaron" className={styles.link}>
          LinkedIn
        </a>{" "}
        and{" "}
        <a href="https://github.com/danielabar" className={styles.link}>
          GitHub
        </a>
        .
      </p>

      <h2 className={styles.subheader}>What I Value in Teams</h2>

      <p className={styles.para}>
        The best teams I've worked with share a few key traits: they communicate
        clearly and directly, they trust each other to make good decisions, they
        document their architectural choices, and they treat production issues
        as learning opportunities rather than blame opportunities. I thrive in
        environments where initiative is encouraged, where asking "why are we
        doing it this way?" is welcomed, and where improving developer
        experience is seen as valuable work.
      </p>

      <p className={styles.para}>
        I don't do leetcode-style interviews - years of public work (GitHub
        repos dating back to 2013, 100+ blog posts, documented volunteer
        contributions) offers better evidence of how I think and what I can
        deliver. Strong technical teams recognize that proven capability matters
        more than performance on contrived exercises.
      </p>
      <AllLink marginTop="30px" />
    </div>
  </Layout>
)

export default About
