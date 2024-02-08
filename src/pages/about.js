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
        Welcome to my programming blog! I'm thrilled you've stumbled upon it.
        With over two decades in software development, I've worked across many
        industries and technology stacks, predominantly focusing on web
        applications in projects, products, and SaaS solutions. My journey began
        with Java, transitioning seamlessly into full-stack JavaScript, with
        brief sojourns into Python and GoLang before finding my professional
        haven in Ruby on Rails nearly five years ago. It's in this environment
        that I've found not only happiness but also peak productivity.
      </p>

      <p className={styles.para}>
        But let's rewind a bit. My fascination with computer science began
        during my first year at university. An introductory course, covering
        everything from hardware to programming, introduced me to the world of
        coding through the Karel programming language. I was captivated by the
        elegance of programming, spending countless hours perfecting assignments
        and even adding extra features just for fun. Little did I know that this
        newfound passion would become my lifelong career.
      </p>

      <p className={styles.para}>
        Upon graduation, I landed a role working on a major retailer's
        e-commerce platform. It was here that the disparity between academic
        theory and practical application first became apparent. While my formal
        education had equipped me with a solid foundation in computer science
        theory, the demands of the job were markedly different. Instead of loop
        invariants and Big-O complexity analysis, I found myself navigating the
        intricacies of version control, database management, and the art of
        translating design comps into pixel-perfect HTML and CSS (before box
        model standardization!). Fortunately I had several wonderful mentors to
        guide me through the on-the-job learning process.
      </p>

      <p className={styles.para}>
        Since then, my career has been defined by a commitment to bridging the
        gap between theory and practice. As I transitioned from a junior
        developer to a leadership role as a Staff Engineer, I've made it my
        mission to advocate for practices that prioritize both efficiency and
        long-term maintainability. From fostering clear communication with
        product stakeholders and quality assurance to championing automated
        testing and CI/CD pipelines, I'm dedicated to nurturing an environment
        where every engineer thrives.
      </p>

      <p className={styles.para}>
        Moreover, as an experienced practitioner, I actively mentor and guide
        fellow engineers, believing strongly in the power of knowledge sharing
        to elevate the entire team. I'm deeply invested in fostering
        reproducible local environments, advocating for architectural
        improvements, and consistently striving for performance optimization and
        observability best practices.
      </p>

      <p className={styles.para}>
        Beyond the confines of my organization, I'm passionate about sharing
        insights and best practices with the broader tech community through
        blogging. This platform not only serves as a means of personal growth
        but also as a conduit for sharing programming stories, problem solving
        techniques, learning strategies, and career development.
      </p>

      <p className={styles.para}>
        So whether you're a seasoned developer or just starting your journey, I
        invite you to join me as we explore the ever-evolving landscape of
        software engineering together. Here's to learning, growing, and building
        better software, one blog post at a time.
      </p>
      <AllLink marginTop="30px" />
    </div>
  </Layout>
)

export default About
