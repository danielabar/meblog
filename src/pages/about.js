import React from "react"
import SEO from "../components/SEO"
import Layout from "../components/layout"
import styles from "./about.module.css"

export default () => (
  <Layout>
    <SEO title="About" pathname="/about" />
    <div className={styles.container}>
      <h1 className={styles.header}>About</h1>

      <p className={styles.para}>
        Hi there, thanks for finding my blog. I'm a fullstack software engineer
        with over 15 years experience delivering consumer facing and large scale
        enterprise applications. I have experience working with a variety of
        database, server and client side technologies. I've been especially
        focused on writing clean, easy to understand code, documentation, test
        driven development, refactoring, and continuous integration. I'm
        passionate about ongoing education to learn new technologies, tools and
        languages.
      </p>

      <h2 className={styles.subheader}>My Story</h2>

      <p className={styles.para}>
        I discovered software development during first year at university.
        Students were not required to pick a major until second year so first
        year was all about discovery. One of the courses I picked was an
        introduction to computers. It covered several areas including hardware,
        networking, programming, and theoretical computer science.
      </p>

      <p className={styles.para}>
        The programming section of this course was taught using{" "}
        <a
          className={styles.link}
          href="https://en.wikipedia.org/wiki/Karel_(programming_language)"
        >
          Karel the Robot
        </a>
        . This is an ideal introductory language because the syntax is very
        simple and the scope of what Karel can do is limited. It's a great way
        to learn the fundamental concepts of programming including variables,
        loops, control flow and functions, while not getting caught up in
        complexities of compilers, data types, memory management, and garbage
        collection (plenty of time for that later!). I enjoyed the programming
        section of this course so much that I would stay up all night perfecting
        my homework assignments and even adding extra features just for fun. At
        some point during first year I learned that people actually get paid to
        do this and decided to make computer science my major.
      </p>

      <p className={styles.para}>
        After graduation I landed a software development job at a big box
        retailer, working on their e-commerce platform. It was at this point
        that I realized my formal education had been long on theory but short on
        the practical. To my great surprise, no one needed me to determine loop
        invariants, compute a proof by induction or perform a{" "}
        <a
          className={styles.link}
          href="https://en.wikipedia.org/wiki/Big_O_notation"
        >
          Big O
        </a>{" "}
        complexity analysis. What was required was the ability to work on a
        large multidisciplinary team, use version control, work with databases,
        keep a large codebase organized, and reproduce pdf design comps in HTML
        and CSS with pixel perfection on all browsers prior to box model
        standardization. Fortunately I had several wonderful mentors to guide me
        through the on-the-job learning process.
      </p>

      <p className={styles.para}>
        Since then I've worked at a number of product, project, and SaaS based
        companies using a variety of languages and frameworks including
        Java/Spring/Hibernate, JavaScript (Node.js, Angular, Ember, React), Go,
        Python and Rails. I decided to take up blogging after many years working
        in this industry. During this time I've learned a lot and decided to
        share it on this blog. Although I've done an enormous amount of
        technical writing during my career, the kind of prose style of writing
        required for a blog is a nice challenge to improve my creative writing
        skills. I hope others will find my posts helpful.
      </p>
    </div>
  </Layout>
)
