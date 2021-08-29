import React from "react"
import { Helmet } from "react-helmet"
import { useStaticQuery, graphql } from "gatsby"
import HelloWorker from "../workers/hello.worker.js"

// https://www.gatsbyjs.com/docs/how-to/querying-data/use-static-query/#how-to-use-usestaticquery-in-components
export default function SEO({
  title,
  description,
  image,
  pathname,
  article,
  track,
}) {
  const data = useStaticQuery(graphql`
    query SEOQuery {
      site {
        siteMetadata {
          defaultTitle: title
          titleTemplate
          defaultDescription: description
          siteUrl: url
          defaultImage: image
          twitterUsername
          googleSiteVerification
        }
      }
    }
  `)
  const recordVisit = track === "NO" ? false : true
  if (typeof window === "object" && recordVisit) {
    const helloWorker = new HelloWorker()
    helloWorker.postMessage([window.location.href, document.referrer])
  }

  const seo = {
    title: title || data.site.siteMetadata.defaultTitle,
    description: description || data.site.siteMetadata.defaultDescription,
    image: `${data.site.siteMetadata.siteUrl}${image ||
      data.site.siteMetadata.defaultImage}`,
    url: `${data.site.siteMetadata.siteUrl}${pathname || "/"}`,
    googleSiteVerification: data.site.siteMetadata.googleSiteVerification,
  }

  return (
    <>
      <Helmet
        title={seo.title}
        titleTemplate={data.site.siteMetadata.titleTemplate}
      >
        <meta name="description" content={seo.description} />
        <meta name="image" content={seo.image} />
        <meta
          name="google-site-verification"
          content={seo.googleSiteVerification}
        />
        {seo.url && <meta property="og:url" content={seo.url} />}
        {(article ? true : null) && (
          <meta property="og:type" content="article" />
        )}
        {!article && <meta property="og:type" content="website" />}
        {seo.title && <meta property="og:title" content={seo.title} />}
        {seo.description && (
          <meta property="og:description" content={seo.description} />
        )}
        {seo.image && <meta property="og:image" content={seo.image} />}
        <meta name="twitter:card" content="summary_large_image" />
        {data.site.siteMetadata.twitterUsername && (
          <meta
            name="twitter:creator"
            content={data.site.siteMetadata.twitterUsername}
          />
        )}
        {seo.title && <meta name="twitter:title" content={seo.title} />}
        {seo.description && (
          <meta name="twitter:description" content={seo.description} />
        )}
        {seo.image && <meta name="twitter:image" content={seo.image} />}
        <link
          rel="apple-touch-icon"
          sizes="57x57"
          href="/apple-icon-57x57.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="60x60"
          href="/apple-icon-60x60.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="72x72"
          href="/apple-icon-72x72.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="76x76"
          href="/apple-icon-76x76.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="114x114"
          href="/apple-icon-114x114.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="120x120"
          href="/apple-icon-120x120.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="144x144"
          href="/apple-icon-144x144.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href="/apple-icon-152x152.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-icon-180x180.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/android-icon-192x192.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="96x96"
          href="/favicon-96x96.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta name="msapplication-TileImage" content="/ms-icon-144x144.png" />
        <meta name="theme-color" content="#ffffff" />
      </Helmet>
    </>
  )
}
